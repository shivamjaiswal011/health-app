import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { formatWeight, type WeightUnit } from '@/domain/units/weight';
import { NumberInput } from '@/ui/number-input';
import { useDebouncedCallback } from '@/ui/use-debounced-callback';
import { WeightInput, type EnteredWeight } from '@/ui/weight-input';

import type { PreviousSet } from '../queries';
import type { SetValues } from '../repository';

const REMOVE_ACTION_WIDTH = 88;
const EDIT_AUTOSAVE_DELAY_MS = 600;

export type LoggedSet = {
  id: string;
  position: number;
  weightKg: number | null;
  weightUnit: WeightUnit;
  reps: number | null;
  completedAt: Date | null;
};

type SetRowProps = {
  set: LoggedSet;
  /** Every exercise numbers its sets from one, so the number alone identifies nothing. */
  exerciseName: string;
  previous: PreviousSet | undefined;
  onComplete: (values: SetValues) => void;
  onUncomplete: () => void;
  onEdit: (values: SetValues) => void;
  onRemove: () => void;
};

/**
 * Last session's numbers for this slot, shown so the lifter knows what to beat — in the
 * unit it was entered in, because a lifter comparing against a machine marked in pounds
 * should not have to notice that the app silently converted.
 */
function previousLabel(previous: PreviousSet | undefined): string {
  if (!previous) return '—';
  if (previous.weightKg === null) return `${previous.reps ?? '—'} reps`;
  return `${formatWeight(previous.weightKg, previous.weightUnit)} × ${previous.reps}`;
}

function RemoveAction({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable
      onPress={onRemove}
      accessibilityLabel={label}
      style={{ width: REMOVE_ACTION_WIDTH }}
      className="items-center justify-center bg-danger">
      <Ionicons name="trash-outline" color="white" size={20} />
    </Pressable>
  );
}

function SetLabels({ position, previous }: { position: number; previous?: PreviousSet }) {
  return (
    <>
      <Text className="w-6 text-center text-sm font-semibold text-content-muted">
        {position + 1}
      </Text>
      <Text className="w-24 text-center text-xs text-content-faint">{previousLabel(previous)}</Text>
    </>
  );
}

type ValueFieldsProps = {
  weight: EnteredWeight;
  set: LoggedSet;
  previous: PreviousSet | undefined;
  onWeight: (entered: EnteredWeight) => void;
  onReps: (value: number | null) => void;
};

function ValueFields({ weight, set, previous, onWeight, onReps }: ValueFieldsProps) {
  return (
    <>
      <View className="flex-1">
        <WeightInput
          value={weight}
          placeholderKg={previous?.weightKg ?? null}
          onChangeWeight={onWeight}
        />
      </View>
      <View className="flex-1">
        <NumberInput
          defaultValue={set.reps}
          onChangeValue={onReps}
          placeholder={previous?.reps?.toString() ?? 'reps'}
        />
      </View>
    </>
  );
}

type CompleteToggleProps = {
  isComplete: boolean;
  label: string;
  onPress: () => void;
};

function CompleteToggle({ isComplete, label, onPress }: CompleteToggleProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isComplete }}
      accessibilityLabel={label}
      className={`h-11 w-11 items-center justify-center rounded-lg ${isComplete ? 'bg-positive' : 'bg-surface-sunken'}`}>
      <Ionicons name="checkmark" size={20} color={isComplete ? 'white' : 'rgb(113,113,122)'} />
    </Pressable>
  );
}

type SetEntry = {
  set: LoggedSet;
  isComplete: boolean;
  onEdit: (values: SetValues) => void;
};

/**
 * What the lifter has typed into the row, and the write-back of a correction.
 *
 * A set already ticked off is history: an edit to it must persist on its own, without
 * the lifter having to un-tick and re-tick the row.
 */
function useSetEntry({ set, isComplete, onEdit }: SetEntry) {
  const [weight, setWeight] = useState<EnteredWeight>({
    weightKg: set.weightKg,
    unit: set.weightUnit,
  });
  const [reps, setReps] = useState(set.reps);
  const saveEdit = useDebouncedCallback(onEdit, EDIT_AUTOSAVE_DELAY_MS);

  const asValues = (entered: EnteredWeight, count: number | null): SetValues => ({
    weightKg: entered.weightKg,
    weightUnit: entered.unit,
    reps: count,
  });

  function handleWeight(next: EnteredWeight) {
    setWeight(next);
    if (isComplete) saveEdit(asValues(next, reps));
  }

  function handleReps(next: number | null) {
    setReps(next);
    if (isComplete) saveEdit(asValues(weight, next));
  }

  return { weight, values: asValues(weight, reps), handleWeight, handleReps };
}

export function SetRow({
  set,
  exerciseName,
  previous,
  onComplete,
  onUncomplete,
  onEdit,
  onRemove,
}: SetRowProps) {
  const isComplete = set.completedAt !== null;
  const { weight, values, handleWeight, handleReps } = useSetEntry({ set, isComplete, onEdit });

  function handleToggle() {
    if (isComplete) return onUncomplete();
    onComplete(values);
  }

  return (
    <ReanimatedSwipeable
      renderRightActions={() => (
        <RemoveAction
          label={`Remove ${exerciseName} set ${set.position + 1}`}
          onRemove={onRemove}
        />
      )}
      overshootRight={false}>
      <View
        className={`flex-row items-center gap-2 px-4 py-1.5 ${isComplete ? 'bg-positive/10' : 'bg-surface-raised'}`}>
        <SetLabels position={set.position} previous={previous} />
        <ValueFields
          weight={weight}
          set={set}
          previous={previous}
          onWeight={handleWeight}
          onReps={handleReps}
        />
        <CompleteToggle
          isComplete={isComplete}
          label={`${exerciseName}, set ${set.position + 1}`}
          onPress={handleToggle}
        />
      </View>
    </ReanimatedSwipeable>
  );
}
