import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { newId } from '@/db/id';
import { createCustomFood } from '@/features/custom-foods/repository';
import { Button } from '@/ui/button';
import { announceFailure } from '@/ui/failure';
import { NumberInput } from '@/ui/number-input';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

type MacroValues = {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

function MacroField({
  label,
  onChange,
  unit,
}: {
  label: string;
  onChange: (next: number | null) => void;
  unit: string;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-line py-3">
      <Text className="text-base text-content">{label}</Text>
      <View className="flex-row items-center gap-2">
        <View className="w-24">
          <NumberInput defaultValue={null} onChangeValue={onChange} placeholder="—" />
        </View>
        <Text className="w-8 text-sm text-content-faint">{unit}</Text>
      </View>
    </View>
  );
}

function MacroFields({
  onChange,
}: {
  onChange: (key: keyof MacroValues) => (next: number | null) => void;
}) {
  return (
    <>
      <Text className="pb-1 text-xs font-semibold uppercase text-content-faint">Per 100 g</Text>
      <MacroField label="Calories" onChange={onChange('kcal')} unit="kcal" />
      <MacroField label="Protein" onChange={onChange('protein')} unit="g" />
      <MacroField label="Carbs" onChange={onChange('carbs')} unit="g" />
      <MacroField label="Fat" onChange={onChange('fat')} unit="g" />
    </>
  );
}

function PortionFields({
  label,
  onLabelChange,
  onGramsChange,
}: {
  label: string;
  onLabelChange: (next: string) => void;
  onGramsChange: (next: number | null) => void;
}) {
  return (
    <>
      <Text className="pb-1 pt-6 text-xs font-semibold uppercase text-content-faint">
        Usual portion (optional)
      </Text>
      <View className="flex-row items-center gap-3 pb-6">
        <TextInput
          value={label}
          onChangeText={onLabelChange}
          placeholder="1 bowl"
          autoCorrect={false}
          className="h-11 flex-1 rounded-lg bg-surface-sunken px-3 text-base text-content"
        />
        <View className="w-24">
          <NumberInput defaultValue={null} onChangeValue={onGramsChange} placeholder="grams" />
        </View>
      </View>
    </>
  );
}

type CustomFoodForm = {
  name: string;
  macros: MacroValues;
  portionLabel: string;
  portionGrams: number | null;
};

function saveFood(form: CustomFoodForm) {
  createCustomFood({
    id: newId(),
    name: form.name.trim(),
    brand: null,
    per100g: {
      kcal: form.macros.kcal ?? 0,
      protein: form.macros.protein ?? 0,
      carbs: form.macros.carbs ?? 0,
      fat: form.macros.fat ?? 0,
      fiber: null,
    },
    portion:
      form.portionLabel.trim() && form.portionGrams
        ? { label: form.portionLabel.trim(), grams: form.portionGrams }
        : null,
  })
    .then(() => router.back())
    .catch((cause) => announceFailure('Saving the food', cause));
}

export default function CustomFoodScreen() {
  const { name: initialName } = useLocalSearchParams<{ name?: string }>();
  const [name, setName] = useState(initialName ?? '');
  const [macros, setMacros] = useState<MacroValues>({
    kcal: null,
    protein: null,
    carbs: null,
    fat: null,
  });
  const [portionLabel, setPortionLabel] = useState('');
  const [portionGrams, setPortionGrams] = useState<number | null>(null);

  function change(key: keyof MacroValues) {
    return (next: number | null) => setMacros((previous) => ({ ...previous, [key]: next }));
  }

  function handleSave() {
    saveFood({ name, macros, portionLabel, portionGrams });
  }

  return (
    <Screen>
      <ScreenHeader left={{ label: 'Cancel', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Your own food</Text>
      <ScrollView contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          autoCorrect={false}
          className="mb-4 h-12 rounded-xl bg-surface-sunken px-4 text-base text-content"
        />

        <MacroFields onChange={change} />
        <PortionFields
          label={portionLabel}
          onLabelChange={setPortionLabel}
          onGramsChange={setPortionGrams}
        />

        <Button label="Save food" onPress={handleSave} disabled={name.trim().length === 0} />
      </ScrollView>
    </Screen>
  );
}
