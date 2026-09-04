import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';

import { newId } from '@/db/id';
import { ExercisePicker } from '@/features/exercise-catalogue/exercise-picker';
import { routineExercisesQuery } from '@/features/routines/queries';
import { addExerciseToRoutine } from '@/features/routines/repository';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';

const DEFAULT_TARGET_SETS = 3;

export default function AddExerciseToRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const entries = useLiveQuery(routineExercisesQuery(routineId));

  function handlePick(exerciseId: string) {
    addExerciseToRoutine({
      id: newId(),
      routineId,
      exerciseId,
      position: entries.data.length,
      targetSets: DEFAULT_TARGET_SETS,
    })
      .then(() => router.back())
      .catch((cause) => announceFailure('Adding the exercise', cause));
  }

  return (
    <Screen title="Add exercise">
      <ExercisePicker onPick={handlePick} />
    </Screen>
  );
}
