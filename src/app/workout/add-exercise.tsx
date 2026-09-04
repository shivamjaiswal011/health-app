import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { newId } from '@/db/id';
import { ExercisePicker } from '@/features/exercise-catalogue/exercise-picker';
import { workoutExercisesQuery } from '@/features/workout-logging/queries';
import { addExerciseToWorkout } from '@/features/workout-logging/repository';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

export default function AddExerciseToWorkoutScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const entries = useLiveQuery(workoutExercisesQuery(workoutId));

  function handlePick(exerciseId: string) {
    addExerciseToWorkout({ id: newId(), workoutId, exerciseId, position: entries.data.length })
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
