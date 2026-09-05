import { Pressable, Text } from 'react-native';

import { toDisplayWeight, toKilograms, type WeightUnit } from '@/domain/units/weight';

import { NumberInput } from './number-input';

export type EnteredWeight = {
  weightKg: number | null;
  unit: WeightUnit;
};

type WeightInputProps = {
  value: EnteredWeight;
  /** Last session's load, shown greyed when the field is empty. */
  placeholderKg: number | null;
  onChangeWeight: (entered: EnteredWeight) => void;
};

function otherUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lb' : 'kg';
}

function displayText(kilograms: number | null, unit: WeightUnit): string | undefined {
  if (kilograms === null) return undefined;
  return String(toDisplayWeight(kilograms, unit));
}

function UnitChip({ unit, onPress }: { unit: WeightUnit; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Weight in ${unit}, switch to ${otherUnit(unit)}`}
      hitSlop={8}
      className="absolute right-1 top-1 h-9 w-8 items-center justify-center rounded-lg bg-surface-raised">
      <Text className="text-[11px] font-semibold text-content-muted">{unit}</Text>
    </Pressable>
  );
}

/**
 * Weight entry in whichever unit the plate or the machine is marked in, reported back in
 * kilograms so storage never changes meaning.
 *
 * Tapping the chip converts what is shown rather than reinterpreting it: 60 kg becomes
 * 132.3 lb, not 60 lb. The field is remounted on that switch — `NumberInput` owns its
 * text so a half-typed entry survives, which also means a new value only reaches it
 * through a new `key`.
 */
export function WeightInput({ value, placeholderKg, onChangeWeight }: WeightInputProps) {
  const { weightKg, unit } = value;

  function handleEntry(entered: number | null) {
    onChangeWeight({ weightKg: entered === null ? null : toKilograms(entered, unit), unit });
  }

  return (
    <NumberInput
      key={unit}
      defaultValue={weightKg === null ? null : toDisplayWeight(weightKg, unit)}
      onChangeValue={handleEntry}
      placeholder={displayText(placeholderKg, unit) ?? unit}
      accessory={
        <UnitChip unit={unit} onPress={() => onChangeWeight({ weightKg, unit: otherUnit(unit) })} />
      }
    />
  );
}
