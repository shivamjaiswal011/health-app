import { and, asc, eq, isNull } from 'drizzle-orm';

import { database } from '@/db/client';
import { exercises, routineExercises, routines, workouts } from '@/db/schema';
import type { RepRange } from '@/domain/training/challenge';
import type { EquipmentType } from '@/domain/training/equipment';
import type { MuscleGroup } from '@/domain/training/muscles';

export function routineListQuery() {
  return database
    .select({
      id: routines.id,
      name: routines.name,
      position: routines.position,
    })
    .from(routines)
    .where(isNull(routines.deletedAt))
    .orderBy(asc(routines.position), asc(routines.name));
}

export function routineQuery(routineId: string) {
  return database
    .select({ id: routines.id, name: routines.name })
    .from(routines)
    .where(and(eq(routines.id, routineId), isNull(routines.deletedAt)))
    .limit(1);
}

export type RoutineExerciseEntry = {
  id: string;
  exerciseId: string;
  name: string;
  position: number;
  equipment: EquipmentType;
  primaryMuscle: MuscleGroup;
  targetSets: number | null;
  /** The challenge-mode rep range. Null on both when the exercise uses the default. */
  targetRepsLow: number | null;
  targetRepsHigh: number | null;
};

export function routineExercisesQuery(routineId: string) {
  return database
    .select({
      id: routineExercises.id,
      exerciseId: exercises.id,
      name: exercises.name,
      position: routineExercises.position,
      equipment: exercises.equipment,
      primaryMuscle: exercises.primaryMuscle,
      targetSets: routineExercises.targetSets,
      targetRepsLow: routineExercises.targetRepsLow,
      targetRepsHigh: routineExercises.targetRepsHigh,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(and(eq(routineExercises.routineId, routineId), isNull(routineExercises.deletedAt)))
    .orderBy(asc(routineExercises.position));
}

/** One-shot read used when starting a workout, where a live subscription is pointless. */
export function loadRoutineExercises(routineId: string): Promise<RoutineExerciseEntry[]> {
  return routineExercisesQuery(routineId);
}

/**
 * The rep range each exercise of a workout's source routine ladders through, keyed by
 * exercise. Read by the logger to show the target it is asking for; an ad-hoc session
 * has no routine and so no ranges.
 */
export type PlannedRepRange = { pinned: Partial<RepRange>; muscle: MuscleGroup };

export async function loadRoutineRepRanges(
  workoutId: string,
): Promise<Map<string, PlannedRepRange>> {
  const rows = await database
    .select({
      exerciseId: routineExercises.exerciseId,
      low: routineExercises.targetRepsLow,
      high: routineExercises.targetRepsHigh,
      primaryMuscle: exercises.primaryMuscle,
    })
    .from(workouts)
    .innerJoin(routineExercises, eq(routineExercises.routineId, workouts.routineId))
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(and(eq(workouts.id, workoutId), isNull(routineExercises.deletedAt)));

  return new Map(
    rows.map((row) => [
      row.exerciseId,
      {
        pinned: { low: row.low ?? undefined, high: row.high ?? undefined },
        muscle: row.primaryMuscle,
      },
    ]),
  );
}
