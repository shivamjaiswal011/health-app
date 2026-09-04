import { FlashList } from '@shopify/flash-list';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import { EmptyState } from '@/ui/empty-state';

import { exerciseSearchQuery, type CatalogueRow } from './queries';

function ExerciseOption({ row, onPick }: { row: CatalogueRow; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} className="border-b border-line px-5 py-3 active:bg-surface-sunken">
      <Text className="text-base text-content">{row.name}</Text>
      <Text className="mt-0.5 text-xs capitalize text-content-faint">
        {row.primaryMuscle.replace('_', ' ')} · {row.equipment}
      </Text>
    </Pressable>
  );
}

/**
 * Searchable catalogue list. Owns only the search term — what happens on selection
 * is the caller's business, which is what lets workouts and routines share it.
 */
export function ExercisePicker({ onPick }: { onPick: (exerciseId: string) => void }) {
  const [term, setTerm] = useState('');
  const results = useLiveQuery(exerciseSearchQuery(term), [term]);

  return (
    <>
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
        renderItem={({ item }) => <ExerciseOption row={item} onPick={() => onPick(item.id)} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState title="No matches" message={`Nothing in the catalogue matches "${term}".`} />
        }
      />
    </>
  );
}
