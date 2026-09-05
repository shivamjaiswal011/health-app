import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { summariseSets, sessionMinutes } from '@/domain/training/session-totals';
import {
  workoutExercisesQuery,
  workoutSetsQuery,
} from '@/features/workout-logging/queries';

import { pastWorkoutQuery } from './queries';

export type PerformedSetRow = Awaited<ReturnType<typeof workoutSetsQuery>>[number];

export type PerformedExerciseGroup = {
  id: string;
  name: string;
  sets: PerformedSetRow[];
};

/**
 * A set counts as performed only once it was ticked off. Rows opened by a routine and
 * never completed are plan, not history, and reporting them would credit the lifter
 * with work they did not do.
 */
function performedOnly(sets: PerformedSetRow[]): PerformedSetRow[] {
  return sets.filter((set) => set.completedAt !== null);
}

function groupByExercise(
  entries: { id: string; name: string }[],
  sets: PerformedSetRow[],
): PerformedExerciseGroup[] {
  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    sets: performedOnly(sets.filter((set) => set.workoutExerciseId === entry.id)),
  }));
}

/** Everything the read-only session screen shows, assembled from three live queries. */
export function usePastSession(workoutId: string) {
  const workout = useLiveQuery(pastWorkoutQuery(workoutId));
  const entries = useLiveQuery(workoutExercisesQuery(workoutId));
  const sets = useLiveQuery(workoutSetsQuery(workoutId));

  const exercises = groupByExercise(entries.data, sets.data);
  const performed = exercises.flatMap((exercise) => exercise.sets);
  const header = workout.data[0];

  return {
    header,
    exercises,
    totals: summariseSets(
      performed.map((set) => ({
        exerciseId: set.workoutExerciseId,
        weightKg: set.weightKg,
        reps: set.reps,
        completedAt: set.completedAt as Date,
      })),
    ),
    minutes: header ? sessionMinutes(header.startedAt, header.endedAt) : null,
  };
}
