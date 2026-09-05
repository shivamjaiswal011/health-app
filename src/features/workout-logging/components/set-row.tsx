import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { NumberInput } from '@/ui/number-input';
import { useDebouncedCallback } from '@/ui/use-debounced-callback';

import type { PreviousSet } from '../queries';
import type { SetValues } from '../repository';

const REMOVE_ACTION_WIDTH = 88;
const EDIT_AUTOSAVE_DELAY_MS = 600;

export type LoggedSet = {
  id: string;
  position: number;
  weightKg: number | null;
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

/** Last session's numbers for this slot, shown so the lifter knows what to beat. */
function previousLabel(previous: PreviousSet | undefined): string {
  if (!previous) return '—';
  if (previous.weightKg === null) return `${previous.reps ?? '—'} reps`;
  return `${previous.weightKg} × ${previous.reps}`;
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
  set: LoggedSet;
  previous: PreviousSet | undefined;
  onWeight: (value: number | null) => void;
  onReps: (value: number | null) => void;
};

function ValueFields({ set, previous, onWeight, onReps }: ValueFieldsProps) {
  return (
    <>
      <View className="flex-1">
        <NumberInput
          defaultValue={set.weightKg}
          onChangeValue={onWeight}
          placeholder={previous?.weightKg?.toString() ?? 'kg'}
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

export function SetRow({
  set,
  exerciseName,
  previous,
  onComplete,
  onUncomplete,
  onEdit,
  onRemove,
}: SetRowProps) {
  const [weightKg, setWeightKg] = useState(set.weightKg);
  const [reps, setReps] = useState(set.reps);
  const isComplete = set.completedAt !== null;

  // A set already ticked off is history: corrections to it must persist on their own,
  // without the lifter having to un-tick and re-tick the row.
  const saveEdit = useDebouncedCallback(onEdit, EDIT_AUTOSAVE_DELAY_MS);

  function handleWeight(next: number | null) {
    setWeightKg(next);
    if (isComplete) saveEdit({ weightKg: next, reps });
  }

  function handleReps(next: number | null) {
    setReps(next);
    if (isComplete) saveEdit({ weightKg, reps: next });
  }

  function handleToggle() {
    if (isComplete) return onUncomplete();
    onComplete({ weightKg, reps });
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
        <ValueFields set={set} previous={previous} onWeight={handleWeight} onReps={handleReps} />
        <CompleteToggle
          isComplete={isComplete}
          label={`${exerciseName}, set ${set.position + 1}`}
          onPress={handleToggle}
        />
      </View>
    </ReanimatedSwipeable>
  );
}
