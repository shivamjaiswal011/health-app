import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import type { MealSlot } from '@/db/schema';
import { announceFailure } from '@/ui/failure';

import { removeFoodEntry } from '../repository';

export type DayEntry = {
  id: string;
  foodNameAtLog: string;
  portionLabel: string | null;
  portionCount: number;
  gramsAtLog: number;
  kcal: number;
};

const MEAL_TITLES: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

function describePortion(entry: DayEntry): string {
  if (!entry.portionLabel) return `${Math.round(entry.gramsAtLog)} g`;
  const count = entry.portionCount === 1 ? '' : `${entry.portionCount} × `;
  return `${count}${entry.portionLabel}`;
}

function confirmRemove(entry: DayEntry) {
  Alert.alert(`Remove ${entry.foodNameAtLog}?`, undefined, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Remove',
      style: 'destructive',
      onPress: () => {
        removeFoodEntry(entry.id).catch((cause) => announceFailure('Removing the entry', cause));
      },
    },
  ]);
}

function EntryRow({ entry }: { entry: DayEntry }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-line py-2.5">
      <View className="flex-1">
        <Text className="text-sm text-content" numberOfLines={1}>
          {entry.foodNameAtLog}
        </Text>
        <Text className="mt-0.5 text-xs text-content-faint">{describePortion(entry)}</Text>
      </View>
      <Text className="text-sm font-semibold text-content">{Math.round(entry.kcal)}</Text>
      <Pressable
        onPress={() => confirmRemove(entry)}
        accessibilityLabel={`Remove ${entry.foodNameAtLog}`}
        className="p-1 active:opacity-60">
        <Ionicons name="close" size={16} color="rgb(113,113,122)" />
      </Pressable>
    </View>
  );
}

type MealSectionProps = {
  slot: MealSlot;
  day: string;
  entries: DayEntry[];
};

export function MealSection({ slot, day, entries }: MealSectionProps) {
  const kcal = entries.reduce((running, entry) => running + entry.kcal, 0);

  return (
    <View className="rounded-2xl bg-surface-raised px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[17px] font-semibold text-content">{MEAL_TITLES[slot]}</Text>
        <Text className="text-[13px] text-content-faint">{Math.round(kcal)} kcal</Text>
      </View>
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} />
      ))}
      <Link href={{ pathname: '/food/search', params: { day, slot } }} asChild>
        <Pressable className="pt-3 active:opacity-60">
          <Text className="text-[15px] font-semibold text-accent">+ Add food</Text>
        </Pressable>
      </Link>
    </View>
  );
}
