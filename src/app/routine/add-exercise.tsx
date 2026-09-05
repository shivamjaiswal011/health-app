import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { newId } from '@/db/id';
import { ExercisePicker } from '@/features/exercise-catalogue/exercise-picker';
import { DEFAULT_TARGET_SETS } from '@/features/routines/defaults';
import { routineExercisesQuery } from '@/features/routines/queries';
import { addExerciseToRoutine } from '@/features/routines/repository';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

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
    <Screen>
      <ScreenHeader left={{ label: 'Cancel', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Add exercise</Text>
      <ExercisePicker onPick={handlePick} />
    </Screen>
  );
}
