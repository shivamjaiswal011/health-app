import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { newId } from '@/db/id';
import type { MealSlot } from '@/db/schema';
import { macrosForGrams, type LoggedMacros } from '@/domain/nutrition/macros';
import { logFood } from '@/features/diet/repository';
import { Button } from '@/ui/button';
import { announceFailure, reportFailure } from '@/ui/failure';
import { NumberInput } from '@/ui/number-input';
import { Sheet } from '@/ui/sheet';

import {
  loadPortions,
  toPerHundredGrams,
  type FoodHit,
  type FoodPortionOption,
} from './queries';

/** Always offered last, so a food with no household measures is still loggable. */
const GRAMS_OPTION: FoodPortionOption = { label: 'grams', grams: 1, isDefault: false };
const DEFAULT_COUNT = 1;

export type LogTarget = {
  day: string;
  slot: MealSlot;
  position: number;
};

function PortionChoice({
  portion,
  selected,
  onSelect,
}: {
  portion: FoodPortionOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={`rounded-full border px-3 py-1.5 ${selected ? 'border-accent bg-accent' : 'border-line bg-surface-sunken'}`}>
      <Text className={`text-xs font-medium ${selected ? 'text-white' : 'text-content'}`}>
        {portion.label}
      </Text>
    </Pressable>
  );
}

function MacroPreview({ grams, macros }: { grams: number; macros: LoggedMacros }) {
  return (
    <Text className="py-4 text-sm text-content-muted">
      {Math.round(grams)} g · {Math.round(macros.kcal)} kcal · P{macros.protein} · C{macros.carbs}{' '}
      · F{macros.fat}
    </Text>
  );
}

function useFoodPortions(foodId: string | undefined): FoodPortionOption[] {
  const foods = useSQLiteContext();
  const [portions, setPortions] = useState<FoodPortionOption[]>([]);

  useEffect(() => {
    if (!foodId) return;
    let abandoned = false;
    loadPortions(foods, foodId)
      .then((loaded) => {
        if (!abandoned) setPortions([...loaded, GRAMS_OPTION]);
      })
      .catch((cause) => reportFailure('Loading portions', cause));
    return () => {
      abandoned = true;
    };
  }, [foods, foodId]);

  return portions;
}

type PortionFormProps = {
  food: FoodHit;
  portions: FoodPortionOption[];
  target: LogTarget;
  onLogged: () => void;
};

function PortionForm({ food, portions, target, onLogged }: PortionFormProps) {
  const [chosen, setChosen] = useState<FoodPortionOption | null>(null);
  const [count, setCount] = useState<number | null>(DEFAULT_COUNT);

  const portion = chosen ?? portions[0] ?? GRAMS_OPTION;
  const grams = (count ?? 0) * portion.grams;
  const macros = macrosForGrams(toPerHundredGrams(food), grams);

  function handleLog() {
    logFood({
      id: newId(),
      loggedOn: target.day,
      mealSlot: target.slot,
      position: target.position,
      foodId: food.id,
      foodSource: 'bundled',
      foodNameAtLog: food.name,
      portionLabel: portion === GRAMS_OPTION ? null : portion.label,
      portionCount: count ?? 0,
      gramsAtLog: grams,
      macros,
    })
      .then(onLogged)
      .catch((cause) => announceFailure('Logging the food', cause));
  }

  return (
    <>
      <View className="flex-row items-center gap-3">
        <View className="w-24">
          <NumberInput defaultValue={DEFAULT_COUNT} onChangeValue={setCount} placeholder="1" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2">
          {portions.map((option) => (
            <PortionChoice
              key={option.label}
              portion={option}
              selected={option.label === portion.label}
              onSelect={() => setChosen(option)}
            />
          ))}
        </ScrollView>
      </View>
      <MacroPreview grams={grams} macros={macros} />
      <Button label="Log food" onPress={handleLog} disabled={grams <= 0} />
    </>
  );
}

export function PortionSheet({
  food,
  target,
  onDismiss,
}: {
  food: FoodHit | null;
  target: LogTarget;
  onDismiss: () => void;
}) {
  const portions = useFoodPortions(food?.id);

  return (
    <Sheet visible={food !== null} onDismiss={onDismiss} title={food?.name}>
      {/* Keyed on the food so a different pick starts from its own default portion
          and count rather than inheriting the previous one. */}
      {food ? (
        <PortionForm
          key={food.id}
          food={food}
          portions={portions}
          target={target}
          onLogged={onDismiss}
        />
      ) : null}
    </Sheet>
  );
}
