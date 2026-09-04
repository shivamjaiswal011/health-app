import { startPlannedWorkout, type PlannedExercise } from '@/features/workout-logging/repository';

import { loadRoutineExercises, routineQuery } from './queries';

/** A routine with no explicit target still opens one empty row to log into. */
const FALLBACK_TARGET_SETS = 1;

function toPlan(entries: Awaited<ReturnType<typeof loadRoutineExercises>>): PlannedExercise[] {
  return entries.map((entry) => ({
    exerciseId: entry.exerciseId,
    targetSets: entry.targetSets ?? FALLBACK_TARGET_SETS,
  }));
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
  await startPlannedWorkout(
    { id: workoutId, name: routine.name, startedAt: new Date(), routineId },
    toPlan(entries),
  );
}
