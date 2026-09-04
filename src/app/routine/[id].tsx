import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { newId } from '@/db/id';
import { RoutineExerciseList } from '@/features/routines/components/routine-exercise-list';
import { routineExercisesQuery, routineQuery } from '@/features/routines/queries';
import { deleteRoutine, renameRoutine } from '@/features/routines/repository';
import { startWorkoutFromRoutine } from '@/features/routines/start-from-routine';
import { Button } from '@/ui/button';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';

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
  function handleRename(next: string) {
    renameRoutine(routineId, next).catch((cause) => announceFailure('Renaming the routine', cause));
  }

  return (
    <TextInput
      defaultValue={name}
      onEndEditing={(event) => handleRename(event.nativeEvent.text)}
      placeholder="Routine name"
      className="mx-5 mb-4 h-12 rounded-xl bg-surface-sunken px-4 text-lg font-semibold text-content"
    />
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

  return (
    <Screen title={name || 'Routine'}>
      <ScrollView contentContainerClassName="pb-8" keyboardShouldPersistTaps="handled">
        <RoutineNameField routineId={id} name={name} />
        <RoutineExerciseList rows={entries.data} />
        <RoutineActions routineId={id} canStart={entries.data.length > 0} />
      </ScrollView>
    </Screen>
  );
}
