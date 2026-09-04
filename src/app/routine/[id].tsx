import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { newId } from '@/db/id';
import { RoutineExerciseList } from '@/features/routines/components/routine-exercise-list';
import { DEFAULT_ROUTINE_NAME } from '@/features/routines/defaults';
import { routineExercisesQuery, routineQuery } from '@/features/routines/queries';
import { deleteRoutine, renameRoutine } from '@/features/routines/repository';
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
      className="mx-5 h-12 rounded-xl bg-surface-sunken px-4 text-lg font-semibold text-content"
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

function RoutineActions({ routineId, canStart }: { routineId: string; canStart: boolean }) {
  function handleStart() {
    const workoutId = newId();
    startWorkoutFromRoutine(routineId, workoutId)
      .then(() => router.replace(`/workout/${workoutId}`))
      .catch((cause) => announceFailure('Starting the workout', cause));
  }

  return (
    <View className="gap-3 px-5 pt-4">
      <Link href={{ pathname: '/routine/add-exercise', params: { routineId } }} asChild>
        <Pressable className="items-center rounded-2xl border border-dashed border-line py-4 active:opacity-60">
          <Text className="text-sm font-semibold text-accent">+ Add exercise</Text>
        </Pressable>
      </Link>
      <Button label="Start workout" onPress={handleStart} disabled={!canStart} />
      <Pressable onPress={() => confirmDelete(routineId)} className="items-center py-2">
        <Text className="text-sm font-semibold text-danger">Delete routine</Text>
      </Pressable>
    </View>
  );
}

export default function RoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = useLiveQuery(routineQuery(id));
  const entries = useLiveQuery(routineExercisesQuery(id));
  const name = routine.data[0]?.name ?? '';

  useDiscardIfUntouched(id, entries.data.length === 0 && name === DEFAULT_ROUTINE_NAME);

  return (
    <Screen>
      <ScreenHeader right={{ label: 'Done', onPress: () => router.back() }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">{name || 'Routine'}</Text>
      <ScrollView contentContainerClassName="pb-8" keyboardShouldPersistTaps="handled">
        <RoutineNameField routineId={id} name={name} />
        <Text className="px-5 pb-4 pt-2 text-xs text-content-faint">
          Changes are saved as you make them.
        </Text>
        <RoutineExerciseList rows={entries.data} />
        <RoutineActions routineId={id} canStart={entries.data.length > 0} />
      </ScrollView>
    </Screen>
  );
}
