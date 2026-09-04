import { FlashList } from '@shopify/flash-list';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { newId } from '@/db/id';
import type { MealSlot } from '@/db/schema';
import { dayEntriesQuery, recentFoodsQuery, type RecentFood } from '@/features/diet/queries';
import { logAgain, logFood } from '@/features/diet/repository';
import { FoodOption } from '@/features/food-search/food-option';
import { PortionSheet, type ChosenPortion } from '@/features/food-search/portion-sheet';
import type { FoodHit } from '@/features/food-search/queries';
import { useCombinedFoodSearch } from '@/features/food-search/use-combined-search';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

const RECENT_LIMIT = 12;

/** Where a logged entry says its food came from, which is not the same as how search
 *  ranked it: USDA and composed dishes both live in the bundled database. */
const FOOD_SOURCE_BY_HIT = {
  usda: 'bundled',
  composed: 'bundled',
  custom: 'custom',
  recipe: 'recipe',
} as const;

function RecentFoodRow({ entry, onRepeat }: { entry: RecentFood; onRepeat: () => void }) {
  return (
    <Pressable
      onPress={onRepeat}
      className="flex-row items-center gap-3 border-b border-line px-5 py-3 active:bg-surface-sunken">
      <View className="flex-1">
        <Text className="text-base text-content" numberOfLines={1}>
          {entry.foodNameAtLog}
        </Text>
        <Text className="mt-0.5 text-xs text-content-faint">
          {entry.portionCount === 1 ? '' : `${entry.portionCount} × `}
          {entry.portionLabel ?? `${Math.round(entry.gramsAtLog)} g`} · {Math.round(entry.kcal)}{' '}
          kcal
        </Text>
      </View>
      <Text className="text-sm font-semibold text-accent">Add</Text>
    </Pressable>
  );
}

function FirstTimeHint() {
  return (
    <View className="items-center gap-2 px-8 pt-16">
      <Text className="text-center text-lg font-semibold text-content">Search to begin</Text>
      <Text className="text-center text-sm text-content-muted">
        Indian dishes rank first, so &quot;rice&quot; finds Steamed Rice before the USDA entries.
        Anything you log appears here afterwards for one-tap repeats.
      </Text>
    </View>
  );
}

function NoMatches({ term }: { term: string }) {
  return (
    <View className="items-center gap-2 px-8 pt-16">
      <Text className="text-center text-lg font-semibold text-content">No matches</Text>
      <Text className="text-center text-sm text-content-muted">
        Nothing matches &quot;{term}&quot;. Add it yourself and it will be there next time.
      </Text>
      <Link href={{ pathname: '/food/custom', params: { name: term } }} asChild>
        <Pressable className="mt-3 active:opacity-60">
          <Text className="text-sm font-semibold text-accent">Create &quot;{term}&quot;</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function SearchResults({
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
      ListEmptyComponent={<NoMatches term={term} />}
    />
  );
}

function RecentList({
  recent,
  onRepeat,
}: {
  recent: RecentFood[];
  onRepeat: (entry: RecentFood) => void;
}) {
  return (
    <FlashList
      data={recent}
      keyExtractor={(entry) => entry.foodId}
      renderItem={({ item }) => <RecentFoodRow entry={item} onRepeat={() => onRepeat(item)} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        recent.length > 0 ? (
          <Text className="px-5 pb-2 text-xs font-semibold uppercase text-content-faint">
            Recent — tap to log again
          </Text>
        ) : null
      }
      ListEmptyComponent={<FirstTimeHint />}
    />
  );
}

/** Both ways of adding a food end the same way: written to the day, then back. */
function useLogging(day: string, slot: MealSlot) {
  const existing = useLiveQuery(dayEntriesQuery(day), [day]);
  const position = existing.data.length;

  function log(chosen: ChosenPortion) {
    logFood({
      id: newId(),
      loggedOn: day,
      mealSlot: slot,
      position,
      foodId: chosen.food.id,
      foodSource: FOOD_SOURCE_BY_HIT[chosen.food.source],
      foodNameAtLog: chosen.food.name,
      portionLabel: chosen.portionLabel,
      portionCount: chosen.portionCount,
      gramsAtLog: chosen.grams,
      macros: chosen.macros,
    })
      .then(() => router.back())
      .catch((cause) => announceFailure('Logging the food', cause));
  }

  function repeat(entry: RecentFood) {
    logAgain(entry, { day, slot, position })
      .then(() => router.back())
      .catch((cause) => announceFailure('Logging the food', cause));
  }

  return { log, repeat };
}

export default function FoodSearchScreen() {
  const { day, slot } = useLocalSearchParams<{ day: string; slot: MealSlot }>();
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState<FoodHit | null>(null);

  const hits = useCombinedFoodSearch(term);
  const recent = useLiveQuery(recentFoodsQuery(RECENT_LIMIT));
  const { log, repeat } = useLogging(day, slot);

  return (
    <Screen>
      <ScreenHeader
        left={{ label: 'Cancel', onPress: () => router.back(), tone: 'muted' }}
        right={{ label: 'Create food', onPress: () => router.push('/food/custom') }}
      />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Add food</Text>
      <TextInput
        value={term}
        onChangeText={setTerm}
        placeholder="Search foods and dishes"
        autoCorrect={false}
        autoCapitalize="none"
        className="mx-5 mb-3 h-11 rounded-xl bg-surface-sunken px-4 text-base text-content"
      />

      {term.trim().length > 0 ? (
        <SearchResults hits={hits} term={term} onPick={setPicked} />
      ) : (
        <RecentList recent={recent.data} onRepeat={repeat} />
      )}

      <PortionSheet
        food={picked}
        confirmLabel="Log food"
        onConfirm={log}
        onDismiss={() => setPicked(null)}
      />
    </Screen>
  );
}
