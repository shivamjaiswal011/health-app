import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { newId } from '@/db/id';
import { today } from '@/domain/nutrition/calendar-day';
import { targetForDayQuery } from '@/features/diet/queries';
import { setNutritionTarget } from '@/features/diet/repository';
import { Button } from '@/ui/button';
import { announceFailure } from '@/ui/failure';
import { NumberInput } from '@/ui/number-input';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

type TargetValues = {
  kcal: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
};

function impliedKcal(fields: TargetValues): number {
  return (
    (fields.proteinGrams ?? 0) * KCAL_PER_GRAM.protein +
    (fields.carbsGrams ?? 0) * KCAL_PER_GRAM.carbs +
    (fields.fatGrams ?? 0) * KCAL_PER_GRAM.fat
  );
}

function TargetField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
  unit: string;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-line py-3">
      <Text className="text-base text-content">{label}</Text>
      <View className="flex-row items-center gap-2">
        <View className="w-24">
          <NumberInput defaultValue={value} onChangeValue={onChange} placeholder="—" />
        </View>
        <Text className="w-6 text-sm text-content-faint">{unit}</Text>
      </View>
    </View>
  );
}

function TargetFields({
  fields,
  onChange,
}: {
  fields: TargetValues;
  onChange: (key: keyof TargetValues) => (next: number | null) => void;
}) {
  return (
    <>
      <TargetField label="Calories" value={fields.kcal} onChange={onChange('kcal')} unit="kcal" />
      <TargetField
        label="Protein"
        value={fields.proteinGrams}
        onChange={onChange('proteinGrams')}
        unit="g"
      />
      <TargetField
        label="Carbs"
        value={fields.carbsGrams}
        onChange={onChange('carbsGrams')}
        unit="g"
      />
      <TargetField label="Fat" value={fields.fatGrams} onChange={onChange('fatGrams')} unit="g" />
    </>
  );
}

function TargetNotes({ fields }: { fields: TargetValues }) {
  return (
    <>
      <Text className="py-4 text-xs text-content-faint">
        Those macros add up to {Math.round(impliedKcal(fields))} kcal. They do not have to match
        the calorie target exactly — leave calories blank to use this figure.
      </Text>
      <Text className="pb-4 text-xs text-content-faint">
        Targets apply from today onward. Days already logged keep the target they were judged
        against.
      </Text>
    </>
  );
}

export default function TargetsScreen() {
  const existing = useLiveQuery(targetForDayQuery(today()));
  const current = existing.data[0];
  const [fields, setFields] = useState<TargetValues>({
    kcal: current?.kcal ?? null,
    proteinGrams: current?.proteinGrams ?? null,
    carbsGrams: current?.carbsGrams ?? null,
    fatGrams: current?.fatGrams ?? null,
  });

  function change(key: keyof TargetValues) {
    return (next: number | null) => setFields((previous) => ({ ...previous, [key]: next }));
  }

  function handleSave() {
    setNutritionTarget({
      id: newId(),
      effectiveFrom: today(),
      kcal: fields.kcal ?? impliedKcal(fields),
      proteinGrams: fields.proteinGrams ?? 0,
      carbsGrams: fields.carbsGrams ?? 0,
      fatGrams: fields.fatGrams ?? 0,
    })
      .then(() => router.back())
      .catch((cause) => announceFailure('Saving your targets', cause));
  }

  return (
    <Screen>
      <ScreenHeader left={{ label: 'Cancel', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Daily targets</Text>
      <ScrollView contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
        <TargetFields fields={fields} onChange={change} />
        <TargetNotes fields={fields} />

        <Button label="Save targets" onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}
