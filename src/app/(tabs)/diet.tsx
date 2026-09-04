import Ionicons from '@expo/vector-icons/Ionicons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { MEAL_SLOTS, type MealSlot } from '@/db/schema';
import { describeDay, shiftDay, today } from '@/domain/nutrition/calendar-day';
import { sumMacros } from '@/domain/nutrition/macros';
import { MacroSummary } from '@/features/diet/components/macro-summary';
import { MealSection, type DayEntry } from '@/features/diet/components/meal-section';
import { dayEntriesQuery, targetForDayQuery } from '@/features/diet/queries';
import { copyDay } from '@/features/diet/repository';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';

function groupByMeal(entries: DayEntry[] & { mealSlot: MealSlot }[]) {
  const grouped = new Map<MealSlot, DayEntry[]>();
  for (const slot of MEAL_SLOTS) grouped.set(slot, []);
  for (const entry of entries) grouped.get(entry.mealSlot)?.push(entry);
  return grouped;
}

function DayNavigator({ day, onChange }: { day: string; onChange: (next: string) => void }) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-3">
      <Pressable
        onPress={() => onChange(shiftDay(day, -1))}
        accessibilityLabel="Previous day"
        className="p-2 active:opacity-60">
        <Ionicons name="chevron-back" size={20} color="rgb(113,113,122)" />
      </Pressable>
      <Text className="text-base font-semibold text-content">{describeDay(day, today())}</Text>
      <Pressable
        onPress={() => onChange(shiftDay(day, 1))}
        accessibilityLabel="Next day"
        className="p-2 active:opacity-60">
        <Ionicons name="chevron-forward" size={20} color="rgb(113,113,122)" />
      </Pressable>
    </View>
  );
}

/** Offered only on an empty day, where it is the fastest way to fill one in. */
function CopyYesterday({ day }: { day: string }) {
  function handleCopy() {
    copyDay(shiftDay(day, -1), day).catch((cause) =>
      announceFailure('Copying yesterday', cause),
    );
  }

  return (
    <Pressable onPress={handleCopy} className="items-center py-1 active:opacity-60">
      <Text className="text-sm font-semibold text-accent">Copy yesterday&apos;s food</Text>
    </Pressable>
  );
}

export default function DietScreen() {
  const [day, setDay] = useState(today);
  const entries = useLiveQuery(dayEntriesQuery(day), [day]);
  const targets = useLiveQuery(targetForDayQuery(day), [day]);

  const byMeal = groupByMeal(entries.data);
  const totals = sumMacros(entries.data);

  return (
    <Screen title="Diet">
      <DayNavigator day={day} onChange={setDay} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8">
        <Pressable onPress={() => router.push('/diet/targets')} className="active:opacity-70">
          <MacroSummary totals={totals} target={targets.data[0] ?? null} />
        </Pressable>
        {entries.data.length === 0 ? <CopyYesterday day={day} /> : null}
        <Pressable
          onPress={() => router.push('/recipe')}
          className="flex-row items-center justify-between rounded-2xl border border-line bg-surface-raised px-4 py-3 active:opacity-60">
          <Text className="text-sm font-semibold text-content">Recipes</Text>
          <Text className="text-sm text-content-faint">›</Text>
        </Pressable>
        {MEAL_SLOTS.map((slot) => (
          <MealSection key={slot} slot={slot} day={day} entries={byMeal.get(slot) ?? []} />
        ))}
      </ScrollView>
    </Screen>
  );
}
