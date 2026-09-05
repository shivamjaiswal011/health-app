import { prefillFromPrevious } from '@/domain/training/prefill';
import { loadPreviousPerformance } from '@/features/workout-logging/queries';
import { startPlannedWorkout, type PlannedExercise } from '@/features/workout-logging/repository';

import { loadRoutineExercises, routineQuery } from './queries';

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
async function planExercise(entry: RoutineEntry, workoutId: string): Promise<PlannedExercise> {
  const previous = await loadPreviousPerformance(entry.exerciseId, workoutId);
  return {
    exerciseId: entry.exerciseId,
    sets: prefillFromPrevious(entry.targetSets ?? FALLBACK_TARGET_SETS, previous),
  };
}

/**
 * Begins a session from a saved routine. The workout keeps a reference to the routine
 * it came from, but copies the exercises rather than pointing at them — editing the
 * routine afterwards must not rewrite a session already performed.
 */
export async function startWorkoutFromRoutine(routineId: string, workoutId: string): Promise<void> {
  const [routine] = await routineQuery(routineId);
  if (!routine) throw new Error(`Routine ${routineId} no longer exists`);

  const entries = await loadRoutineExercises(routineId);
  const plan = await Promise.all(entries.map((entry) => planExercise(entry, workoutId)));

  await startPlannedWorkout(
    { id: workoutId, name: routine.name, startedAt: new Date(), routineId },
    plan,
  );
}
