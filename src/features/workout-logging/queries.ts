import { and, asc, desc, eq, isNotNull, isNull, ne } from 'drizzle-orm';

import { database } from '@/db/client';
import { exercises, sets, workoutExercises, workouts } from '@/db/schema';

/** The single unfinished session, if one exists. Live-queried by the logger. */
export function activeWorkoutQuery() {
  return database
    .select()
    .from(workouts)
    .where(and(isNull(workouts.endedAt), isNull(workouts.deletedAt)))
    .orderBy(desc(workouts.startedAt))
    .limit(1);
}

export function workoutExercisesQuery(workoutId: string) {
  return database
    .select({
      id: workoutExercises.id,
      position: workoutExercises.position,
      exerciseId: exercises.id,
      name: exercises.name,
      trackingMode: exercises.trackingMode,
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(and(eq(workoutExercises.workoutId, workoutId), isNull(workoutExercises.deletedAt)))
    .orderBy(asc(workoutExercises.position));
}

export function workoutSetsQuery(workoutId: string) {
  return database
    .select({
      id: sets.id,
      workoutExerciseId: sets.workoutExerciseId,
      position: sets.position,
      setType: sets.setType,
      weightKg: sets.weightKg,
      reps: sets.reps,
      completedAt: sets.completedAt,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(and(eq(workoutExercises.workoutId, workoutId), isNull(sets.deletedAt)))
    .orderBy(asc(sets.position));
}

const HISTORY_PAGE_SIZE = 50;

export function workoutHistoryQuery() {
  return database
    .select({
      id: workouts.id,
      name: workouts.name,
      startedAt: workouts.startedAt,
      endedAt: workouts.endedAt,
    })
    .from(workouts)
    .where(and(isNotNull(workouts.endedAt), isNull(workouts.deletedAt)))
    .orderBy(desc(workouts.startedAt))
    .limit(HISTORY_PAGE_SIZE);
}

export type PreviousSet = {
  position: number;
  weightKg: number | null;
  reps: number | null;
};

/**
 * A set only counts as history when nothing above it has been deleted. Discarding a
 * workout tombstones the workout row alone, so its sets remain individually alive —
 * the parent's tombstone has to be checked explicitly or a discarded session keeps
 * supplying ghost values.
 */
const liveCompletedSet = (exerciseId: string) =>
  and(
    eq(sets.exerciseId, exerciseId),
    isNotNull(sets.completedAt),
    isNull(sets.deletedAt),
    isNull(workoutExercises.deletedAt),
    isNull(workouts.deletedAt),
  );

async function findLastWorkoutTraining(exerciseId: string, excludingWorkoutId: string) {
  const [latest] = await database
    .select({ workoutId: workoutExercises.workoutId })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(and(liveCompletedSet(exerciseId), ne(workoutExercises.workoutId, excludingWorkoutId)))
    .orderBy(desc(sets.completedAt))
    .limit(1);
  return latest?.workoutId ?? null;
}

/**
 * What the lifter did for this exercise the last time they trained it — the ghost
 * values shown behind each empty set row.
 *
 * Ordered by position, not time, so the ghosts line up with the rows they sit behind.
 * Returns an empty array when the exercise has never been completed before.
 */
export async function loadPreviousPerformance(
  exerciseId: string,
  excludingWorkoutId: string,
): Promise<PreviousSet[]> {
  const previousWorkoutId = await findLastWorkoutTraining(exerciseId, excludingWorkoutId);
  if (previousWorkoutId === null) return [];

  return database
    .select({ position: sets.position, weightKg: sets.weightKg, reps: sets.reps })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(liveCompletedSet(exerciseId), eq(workoutExercises.workoutId, previousWorkoutId)),
    )
    .orderBy(asc(sets.position));
}
