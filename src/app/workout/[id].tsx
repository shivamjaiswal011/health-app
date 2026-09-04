import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { ExerciseBlock } from '@/features/workout-logging/components/exercise-block';
import { RestTimerBar } from '@/features/workout-logging/components/rest-timer-bar';
import { groupSetsByExercise } from '@/features/workout-logging/group-sets';
import { workoutExercisesQuery, workoutSetsQuery } from '@/features/workout-logging/queries';
import { discardWorkout, finishWorkout } from '@/features/workout-logging/repository';
import { useRestTimer } from '@/features/workout-logging/rest-timer';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';

const NO_SETS: never[] = [];

function confirmDiscard(workoutId: string, onDiscarded: () => void) {
  Alert.alert('Discard workout?', 'Every set logged in this session will be removed.', [
    { text: 'Keep logging', style: 'cancel' },
    {
      text: 'Discard',
      style: 'destructive',
      onPress: () => {
        discardWorkout(workoutId)
          .then(onDiscarded)
          .catch((cause) => announceFailure('Discarding the workout', cause));
      },
    },
  ]);
}

function WorkoutHeader({ workoutId }: { workoutId: string }) {
  const stopRest = useRestTimer((state) => state.stopRest);

  function leaveSession() {
    stopRest();
    router.replace('/workouts');
  }

  function handleFinish() {
    finishWorkout(workoutId)
      .then(leaveSession)
      .catch((cause) => announceFailure('Finishing the workout', cause));
  }

  return (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
      <Pressable onPress={() => confirmDiscard(workoutId, leaveSession)}>
        <Text className="text-sm font-semibold text-danger">Discard</Text>
      </Pressable>
      <Pressable onPress={handleFinish}>
        <Text className="text-sm font-semibold text-accent">Finish</Text>
      </Pressable>
    </View>
  );
}

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entries = useLiveQuery(workoutExercisesQuery(id));
  const sets = useLiveQuery(workoutSetsQuery(id));
  const setsByExercise = groupSetsByExercise(sets.data);

  return (
    <Screen title="Workout">
      <WorkoutHeader workoutId={id} />
      <ScrollView contentContainerClassName="px-4 pb-8" keyboardShouldPersistTaps="handled">
        {entries.data.map((entry) => (
          <ExerciseBlock
            key={entry.id}
            entry={entry}
            workoutId={id}
            sets={setsByExercise.get(entry.id) ?? NO_SETS}
          />
        ))}
        <Link href={{ pathname: '/workout/add-exercise', params: { workoutId: id } }} asChild>
          <Pressable className="items-center rounded-2xl border border-dashed border-line py-4 active:opacity-60">
            <Text className="text-sm font-semibold text-accent">+ Add exercise</Text>
          </Pressable>
        </Link>
      </ScrollView>
      <RestTimerBar />
    </Screen>
  );
}
