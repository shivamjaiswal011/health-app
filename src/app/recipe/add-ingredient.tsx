import { FlashList } from '@shopify/flash-list';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { newId } from '@/db/id';
import { FoodOption } from '@/features/food-search/food-option';
import { PortionSheet, type ChosenPortion } from '@/features/food-search/portion-sheet';
import type { FoodHit } from '@/features/food-search/queries';
import { useCombinedFoodSearch } from '@/features/food-search/use-combined-search';
import { recipeItemsQuery } from '@/features/recipes/queries';
import { addRecipeItem } from '@/features/recipes/repository';
import { EmptyState } from '@/ui/empty-state';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

function IngredientResults({
  hits,
  term,
  onPick,
}: {
  hits: FoodHit[];
  term: string;
  onPick: (hit: FoodHit) => void;
}) {
  return (
    <FlashList
      data={hits}
      keyExtractor={(hit) => hit.id}
      renderItem={({ item }) => <FoodOption hit={item} onPick={() => onPick(item)} />}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <EmptyState
          title={term ? 'No matches' : 'Search for an ingredient'}
          message={
            term
              ? `Nothing matches "${term}".`
              : 'Ingredients are stored with the macros they had when added.'
          }
        />
      }
    />
  );
}

export default function AddIngredientScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState<FoodHit | null>(null);
  const hits = useCombinedFoodSearch(term);
  const items = useLiveQuery(recipeItemsQuery(recipeId));

  function handleAdd(chosen: ChosenPortion) {
    addRecipeItem({
      id: newId(),
      recipeId,
      foodId: chosen.food.id,
      foodSource: chosen.food.source === 'custom' ? 'custom' : 'bundled',
      foodName: chosen.food.name,
      grams: chosen.grams,
      position: items.data.length,
      macros: chosen.macros,
    })
      .then(() => router.back())
      .catch((cause) => announceFailure('Adding the ingredient', cause));
  }

  return (
    <Screen>
      <ScreenHeader left={{ label: 'Cancel', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Add ingredient</Text>
      <TextInput
        value={term}
        onChangeText={setTerm}
        placeholder="Search foods"
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus
        className="mx-5 mb-3 h-11 rounded-xl bg-surface-sunken px-4 text-base text-content"
      />
      <IngredientResults hits={hits} term={term} onPick={setPicked} />
      <PortionSheet
        food={picked}
        confirmLabel="Add to recipe"
        onConfirm={handleAdd}
        onDismiss={() => setPicked(null)}
      />
    </Screen>
  );
}
