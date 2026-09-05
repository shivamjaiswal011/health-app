import { prefillFromPrevious } from '@/domain/training/prefill';
import { loadPreviousPerformance } from '@/features/workout-logging/queries';
import { startPlannedWorkout, type PlannedExercise } from '@/features/workout-logging/repository';

import { loadRoutineExercises, routineQuery } from './queries';

import type { WeightUnit } from '@/domain/units/weight';

/**
 * How the lifter has the app configured. Passed in rather than read here so this module
 * stays free of the device preference store, which cannot be loaded outside a device.
 */
export type SessionPreferences = {
  /** Used only for an exercise with no history; otherwise the unit follows the lift. */
  fallbackUnit: WeightUnit;
};

/** A routine with no explicit target still opens one row to log into. */
const FALLBACK_TARGET_SETS = 1;

type RoutineEntry = Awaited<ReturnType<typeof loadRoutineExercises>>[number];

/**
 * Builds the session's opening state: the routine says how many sets, the lifter's own
 * last session says what to put in them.
 *
 * Looked up per exercise rather than per routine, so the numbers follow the lift even
 * if it was last trained in a different routine or an ad-hoc session — which is what a
 * lifter means by "what did I do last time".
 */
type ExercisePlanRequest = {
  entry: RoutineEntry;
  workoutId: string;
  preferences: SessionPreferences;
};

async function planExercise(request: ExercisePlanRequest): Promise<PlannedExercise> {
  const { entry, workoutId, preferences } = request;
  const previous = await loadPreviousPerformance(entry.exerciseId, workoutId);
  return {
    exerciseId: entry.exerciseId,
    sets: prefillFromPrevious(
      entry.targetSets ?? FALLBACK_TARGET_SETS,
      previous,
      preferences.fallbackUnit,
    ),
  };
}

/**
 * Begins a session from a saved routine. The workout keeps a reference to the routine
 * it came from, but copies the exercises rather than pointing at them — editing the
 * routine afterwards must not rewrite a session already performed.
 */
export async function startWorkoutFromRoutine(
  routineId: string,
  workoutId: string,
  preferences: SessionPreferences,
): Promise<void> {
  const [routine] = await routineQuery(routineId);
  if (!routine) throw new Error(`Routine ${routineId} no longer exists`);

  const entries = await loadRoutineExercises(routineId);
  const plan = await Promise.all(
    entries.map((entry) => planExercise({ entry, workoutId, preferences })),
  );

  await startPlannedWorkout(
    { id: workoutId, name: routine.name, startedAt: new Date(), routineId },
    plan,
  );
}
