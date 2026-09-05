import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { macrosForGrams, type LoggedMacros } from '@/domain/nutrition/macros';
import { customFoodPortionsQuery } from '@/features/custom-foods/repository';
import { Button } from '@/ui/button';
import { reportFailure } from '@/ui/failure';
import { NumberInput } from '@/ui/number-input';
import { Sheet } from '@/ui/sheet';

import { loadPortions, toPerHundredGrams, type FoodHit, type FoodPortionOption } from './queries';

/** Always offered last, so a food with no household measures is still loggable. */
const GRAMS_OPTION: FoodPortionOption = { label: 'grams', grams: 1, isDefault: false };
const DEFAULT_COUNT = 1;

/** What the user settled on. The sheet decides the amount; the caller decides what
 *  to do with it — log it against a day, or add it to a recipe. */
export type ChosenPortion = {
  food: FoodHit;
  portionLabel: string | null;
  portionCount: number;
  grams: number;
  macros: LoggedMacros;
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
      {Math.round(grams)} g · {Math.round(macros.kcal)} kcal · P{macros.protein} · C{macros.carbs} ·
      F{macros.fat}
    </Text>
  );
}

async function portionsFor(bundled: SQLiteDatabase, food: FoodHit): Promise<FoodPortionOption[]> {
  if (food.source === 'recipe') {
    const grams = food.servingGrams ?? 0;
    return grams > 0 ? [{ label: '1 serving', grams, isDefault: true }] : [];
  }
  if (food.source === 'custom') {
    const rows = await customFoodPortionsQuery(food.id);
    return rows.map((row) => ({ label: row.label, grams: row.grams, isDefault: true }));
  }
  return loadPortions(bundled, food.id);
}

function useFoodPortions(food: FoodHit | null): FoodPortionOption[] {
  const bundled = useSQLiteContext();
  const [portions, setPortions] = useState<FoodPortionOption[]>([]);

  useEffect(() => {
    if (!food) return;
    let abandoned = false;
    portionsFor(bundled, food)
      .then((loaded) => {
        if (!abandoned) setPortions([...loaded, GRAMS_OPTION]);
      })
      .catch((cause) => reportFailure('Loading portions', cause));
    return () => {
      abandoned = true;
    };
  }, [bundled, food]);

  return portions;
}

type PortionFormProps = {
  food: FoodHit;
  portions: FoodPortionOption[];
  confirmLabel: string;
  onConfirm: (chosen: ChosenPortion) => void;
};

function PortionForm({ food, portions, confirmLabel, onConfirm }: PortionFormProps) {
  const [chosen, setChosen] = useState<FoodPortionOption | null>(null);
  const [count, setCount] = useState<number | null>(DEFAULT_COUNT);

  const portion = chosen ?? portions[0] ?? GRAMS_OPTION;
  const grams = (count ?? 0) * portion.grams;
  const macros = macrosForGrams(toPerHundredGrams(food), grams);

  function handleConfirm() {
    onConfirm({
      food,
      portionLabel: portion === GRAMS_OPTION ? null : portion.label,
      portionCount: count ?? 0,
      grams,
      macros,
    });
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
      <Button label={confirmLabel} onPress={handleConfirm} disabled={grams <= 0} />
    </>
  );
}

export function PortionSheet({
  food,
  confirmLabel,
  onConfirm,
  onDismiss,
}: {
  food: FoodHit | null;
  confirmLabel: string;
  onConfirm: (chosen: ChosenPortion) => void;
  onDismiss: () => void;
}) {
  const portions = useFoodPortions(food);

  return (
    <Sheet visible={food !== null} onDismiss={onDismiss} title={food?.name}>
      {/* Keyed on the food so a different pick starts from its own default portion
          and count rather than inheriting the previous one. */}
      {food ? (
        <PortionForm
          key={food.id}
          food={food}
          portions={portions}
          confirmLabel={confirmLabel}
          onConfirm={onConfirm}
        />
      ) : null}
    </Sheet>
  );
}
