import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { newId } from '@/db/id';
import { RoutineExerciseList } from '@/features/routines/components/routine-exercise-list';
import { DEFAULT_ROUTINE_NAME } from '@/features/routines/defaults';
import { routineExercisesQuery, routineQuery } from '@/features/routines/queries';
import { deleteRoutine, renameRoutine } from '@/features/routines/repository';
import { displayUnit } from '@/features/settings/units';
import { startWorkoutFromRoutine } from '@/features/routines/start-from-routine';
import { Button } from '@/ui/button';
import { announceFailure, reportFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';
import { useAutosavedText } from '@/ui/use-autosaved-text';

function confirmDelete(routineId: string) {
  Alert.alert('Delete routine?', 'Sessions already logged from it are kept.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        deleteRoutine(routineId)
          .then(() => router.replace('/workouts'))
          .catch((cause) => announceFailure('Deleting the routine', cause));
      },
    },
  ]);
}

/**
 * The name field doubles as the screen's title, so there is no separate heading. Showing
 * both meant the same words twice, forty points apart.
 */
function RoutineNameField({ routineId, name }: { routineId: string; name: string }) {
  const field = useAutosavedText(name, (next) => {
    renameRoutine(routineId, next.trim() || DEFAULT_ROUTINE_NAME).catch((cause) =>
      announceFailure('Renaming the routine', cause),
    );
  });

  return (
    <TextInput
      value={field.value}
      onChangeText={field.onChangeText}
      placeholder="Routine name"
      autoCorrect={false}
      selectTextOnFocus
      className="px-5 pb-1 text-[34px] font-bold leading-tight text-content"
    />
  );
}

/**
 * A routine the user opened and left without naming or filling in is not worth keeping.
 * Discarding it on the way out is what stops the list collecting rows called
 * "New Routine". Anything the user actually changed is kept.
 */
function useDiscardIfUntouched(routineId: string, isUntouched: boolean) {
  const untouched = useRef(isUntouched);

  useEffect(() => {
    untouched.current = isUntouched;
  }, [isUntouched]);

  useEffect(
    () => () => {
      if (!untouched.current) return;
      deleteRoutine(routineId).catch((cause) =>
        reportFailure('Discarding an empty routine', cause),
      );
    },
    [routineId],
  );
}

function AddExerciseButton({ routineId }: { routineId: string }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/routine/add-exercise', params: { routineId } })}
      className="mt-3 h-[50px] flex-row items-center justify-center rounded-2xl bg-surface-raised active:opacity-70">
      <Text className="text-[17px] font-semibold text-accent">+ Add exercise</Text>
    </Pressable>
  );
}

export default function RoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = useLiveQuery(routineQuery(id));
  const entries = useLiveQuery(routineExercisesQuery(id));
  const loaded = routine.data[0];
  const name = loaded?.name ?? '';

  useDiscardIfUntouched(id, entries.data.length === 0 && name === DEFAULT_ROUTINE_NAME);

  function handleStart() {
    const workoutId = newId();
    startWorkoutFromRoutine(id, workoutId, { fallbackUnit: displayUnit() })
      .then(() => router.replace(`/workout/${workoutId}`))
      .catch((cause) => announceFailure('Starting the workout', cause));
  }

  return (
    <Screen>
      <ScreenHeader right={{ label: 'Done', onPress: () => router.back() }} />
      {loaded ? <RoutineNameField routineId={id} name={name} /> : null}
      <Text className="px-5 pb-5 text-[13px] text-content-faint">
        Saved as you type. Hold the handle to reorder.
      </Text>

      <ScrollView contentContainerClassName="pb-10" keyboardShouldPersistTaps="handled">
        <RoutineExerciseList rows={entries.data} />
        <View className="px-5">
          <AddExerciseButton routineId={id} />
          <View className="pt-6">
            <Button
              label="Start workout"
              onPress={handleStart}
              disabled={entries.data.length === 0}
            />
          </View>
          <View className="pt-8">
            <Button label="Delete routine" variant="danger" onPress={() => confirmDelete(id)} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
