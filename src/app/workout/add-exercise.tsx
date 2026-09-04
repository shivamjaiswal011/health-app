import { FlashList } from '@shopify/flash-list';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { newId } from '@/db/id';
import { exerciseSearchQuery, workoutExercisesQuery } from '@/features/workout-logging/queries';
import { addExerciseToWorkout } from '@/features/workout-logging/repository';
import { EmptyState } from '@/ui/empty-state';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';

type CatalogueRow = {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
};

function ExerciseOption({ row, onPick }: { row: CatalogueRow; onPick: () => void }) {
  return (
    <Pressable
      onPress={onPick}
      className="border-b border-line px-5 py-3 active:bg-surface-sunken">
      <Text className="text-base text-content">{row.name}</Text>
      <Text className="mt-0.5 text-xs capitalize text-content-faint">
        {row.primaryMuscle.replace('_', ' ')} · {row.equipment}
      </Text>
    </Pressable>
  );
}

export default function AddExerciseScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [term, setTerm] = useState('');
  const results = useLiveQuery(exerciseSearchQuery(term), [term]);
  const entries = useLiveQuery(workoutExercisesQuery(workoutId));

  function handlePick(exerciseId: string) {
    addExerciseToWorkout({
      id: newId(),
      workoutId,
      exerciseId,
      position: entries.data.length,
    })
      .then(() => router.back())
      .catch((cause) => announceFailure('Adding the exercise', cause));
  }

  return (
    <Screen title="Add exercise">
      <TextInput
        value={term}
        onChangeText={setTerm}
        placeholder="Search exercises"
        autoCorrect={false}
        className="mx-5 mb-3 h-11 rounded-xl bg-surface-sunken px-4 text-base text-content"
      />
      <FlashList
        data={results.data}
        keyExtractor={(row) => row.id}
        renderItem={({ item }) => (
          <ExerciseOption row={item} onPick={() => handlePick(item.id)} />
        )}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState title="No matches" message={`Nothing in the catalogue matches "${term}".`} />
        }
      />
    </Screen>
  );
}
