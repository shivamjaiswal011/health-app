import { loadWorkoutPlan } from '@/features/workout-logging/queries';

import { DEFAULT_TARGET_SETS } from './defaults';
import { createRoutineWithExercises } from './repository';

type SaveAsRoutineRequest = {
  workoutId: string;
  routineId: string;
  name: string;
};

/**
 * Turns a session that has already been performed into a reusable routine, so a lifter
 * can build the workout as they go and keep it afterwards rather than having to plan a
 * routine before training.
 *
 * Target sets come from how many sets were actually logged for each exercise.
 */
export async function saveWorkoutAsRoutine(request: SaveAsRoutineRequest): Promise<void> {
  const performed = await loadWorkoutPlan(request.workoutId);
  if (performed.length === 0) throw new Error('This workout has no exercises to save');

  await createRoutineWithExercises(
    { id: request.routineId, name: request.name, position: 0 },
    performed.map((entry) => ({
      exerciseId: entry.exerciseId,
      targetSets: entry.setCount > 0 ? entry.setCount : DEFAULT_TARGET_SETS,
    })),
  );
}
