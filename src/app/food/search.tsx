import { FlashList } from '@shopify/flash-list';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';

import type { MealSlot } from '@/db/schema';
import { dayEntriesQuery } from '@/features/diet/queries';
import { PortionSheet } from '@/features/food-search/portion-sheet';
import { searchFoods, type FoodHit } from '@/features/food-search/queries';
import { EmptyState } from '@/ui/empty-state';
import { reportFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

function useFoodSearch(term: string): FoodHit[] {
  const foods = useSQLiteContext();
  const [hits, setHits] = useState<FoodHit[]>([]);

  useEffect(() => {
    let abandoned = false;
    searchFoods(foods, term)
      .then((found) => {
        if (!abandoned) setHits(found);
      })
      .catch((cause) => reportFailure('Searching foods', cause));
    return () => {
      abandoned = true;
    };
  }, [foods, term]);

  return hits;
}

function FoodOption({ hit, onPick }: { hit: FoodHit; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} className="border-b border-line px-5 py-3 active:bg-surface-sunken">
      <Text className="text-base text-content" numberOfLines={1}>
        {hit.name}
      </Text>
      <Text className="mt-0.5 text-xs text-content-faint">
        {Math.round(hit.kcalPer100g)} kcal · P{hit.proteinPer100g} · C{hit.carbsPer100g} · F
        {hit.fatPer100g} per 100 g
      </Text>
    </Pressable>
  );
}

export default function FoodSearchScreen() {
  const { day, slot } = useLocalSearchParams<{ day: string; slot: MealSlot }>();
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState<FoodHit | null>(null);
  const hits = useFoodSearch(term);
  const existing = useLiveQuery(dayEntriesQuery(day), [day]);

  return (
    <Screen>
      <ScreenHeader left={{ label: 'Cancel', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Add food</Text>
      <TextInput
        value={term}
        onChangeText={setTerm}
        placeholder="Search foods and dishes"
        autoCorrect={false}
        autoFocus
        className="mx-5 mb-3 h-11 rounded-xl bg-surface-sunken px-4 text-base text-content"
      />
      <FlashList
        data={hits}
        keyExtractor={(hit) => hit.id}
        renderItem={({ item }) => <FoodOption hit={item} onPick={() => setPicked(item)} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title={term ? 'No matches' : 'Search to begin'}
            message={
              term
                ? `Nothing matches "${term}". Indian dishes are listed by their usual names — try "roti" or "dal".`
                : 'Indian dishes rank first, so "rice" finds Steamed Rice before the USDA entries.'
            }
          />
        }
      />
      <PortionSheet
        food={picked}
        target={{ day, slot, position: existing.data.length }}
        onDismiss={() => {
          setPicked(null);
          router.back();
        }}
      />
    </Screen>
  );
}
