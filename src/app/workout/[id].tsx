import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, Text } from 'react-native';

import { newId } from '@/db/id';
import { saveWorkoutAsRoutine } from '@/features/routines/save-as-routine';
import { ExerciseBlock } from '@/features/workout-logging/components/exercise-block';
import { useChallengeTargets } from '@/features/workout-logging/use-challenge-targets';
import { RestTimerBar } from '@/features/workout-logging/components/rest-timer-bar';
import { groupSetsByExercise } from '@/features/workout-logging/group-sets';
import {
  workoutExercisesQuery,
  workoutQuery,
  workoutSetsQuery,
} from '@/features/workout-logging/queries';
import { discardWorkout, finishWorkout } from '@/features/workout-logging/repository';
import { useRestTimer } from '@/features/workout-logging/rest-timer';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

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
    <ScreenHeader
      left={{
        label: 'Discard',
        tone: 'danger',
        onPress: () => confirmDiscard(workoutId, leaveSession),
      }}
      right={{ label: 'Finish', onPress: handleFinish }}
    />
  );
}

/**
 * Keeps a session that was built on the fly. Without this a lifter has to plan a
 * routine before training in order to ever reuse the structure.
 */
function SaveAsRoutineAction({ workoutId }: { workoutId: string }) {
  const workout = useLiveQuery(workoutQuery(workoutId));
  const name = workout.data[0]?.name ?? 'Routine';

  function handleSave() {
    const routineId = newId();
    saveWorkoutAsRoutine({ workoutId, routineId, name })
      .then(() => router.push(`/routine/${routineId}`))
      .catch((cause) => announceFailure('Saving as a routine', cause));
  }

  return (
    <Pressable onPress={handleSave} className="items-center py-4 active:opacity-60">
      <Text className="text-sm font-semibold text-accent">Save this workout as a routine</Text>
    </Pressable>
  );
}

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entries = useLiveQuery(workoutExercisesQuery(id));
  const sets = useLiveQuery(workoutSetsQuery(id));
  const setsByExercise = groupSetsByExercise(sets.data);
  const challengeTarget = useChallengeTargets(id);

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
            challengeTarget={challengeTarget}
          />
        ))}
        <Link href={{ pathname: '/workout/add-exercise', params: { workoutId: id } }} asChild>
          <Pressable className="items-center rounded-2xl border border-dashed border-line py-4 active:opacity-60">
            <Text className="text-sm font-semibold text-accent">+ Add exercise</Text>
          </Pressable>
        </Link>
        {entries.data.length > 0 && <SaveAsRoutineAction workoutId={id} />}
      </ScrollView>
      <RestTimerBar />
    </Screen>
  );
}
