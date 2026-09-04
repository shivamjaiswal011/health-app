import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { SetValues } from '../repository';
import type { PreviousSet } from '../queries';
import { NumberInput } from '@/ui/number-input';

const REMOVE_ACTION_WIDTH = 88;

export type LoggedSet = {
  id: string;
  position: number;
  weightKg: number | null;
  reps: number | null;
  completedAt: Date | null;
};

type SetRowProps = {
  set: LoggedSet;
  previous: PreviousSet | undefined;
  onComplete: (values: SetValues) => void;
  onUncomplete: () => void;
  onRemove: () => void;
};

/** Last session's numbers for this slot, shown so the lifter knows what to beat. */
function previousLabel(previous: PreviousSet | undefined): string {
  if (!previous) return '—';
  if (previous.weightKg === null) return `${previous.reps ?? '—'} reps`;
  return `${previous.weightKg} × ${previous.reps}`;
}

function RemoveAction({ onRemove }: { onRemove: () => void }) {
  return (
    <Pressable
      onPress={onRemove}
      accessibilityLabel="Remove set"
      style={{ width: REMOVE_ACTION_WIDTH }}
      className="items-center justify-center bg-danger">
      <Ionicons name="trash-outline" color="white" size={20} />
    </Pressable>
  );
}

export function SetRow({ set, previous, onComplete, onUncomplete, onRemove }: SetRowProps) {
  const [weightKg, setWeightKg] = useState(set.weightKg);
  const [reps, setReps] = useState(set.reps);
  const isComplete = set.completedAt !== null;

  function handleToggle() {
    if (isComplete) return onUncomplete();
    onComplete({ weightKg, reps });
  }

  return (
    <ReanimatedSwipeable
      renderRightActions={() => <RemoveAction onRemove={onRemove} />}
      overshootRight={false}>
      <View
        className={`flex-row items-center gap-2 px-4 py-1.5 ${isComplete ? 'bg-positive/10' : 'bg-surface-raised'}`}>
        <Text className="w-6 text-center text-sm font-semibold text-content-muted">
          {set.position + 1}
        </Text>
        <Text className="w-24 text-center text-xs text-content-faint">
          {previousLabel(previous)}
        </Text>
        <View className="flex-1">
          <NumberInput
            defaultValue={set.weightKg}
            onChangeValue={setWeightKg}
            placeholder={previous?.weightKg?.toString() ?? 'kg'}
          />
        </View>
        <View className="flex-1">
          <NumberInput
            defaultValue={set.reps}
            onChangeValue={setReps}
            placeholder={previous?.reps?.toString() ?? 'reps'}
          />
        </View>
        <Pressable
          onPress={handleToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isComplete }}
          accessibilityLabel={`Set ${set.position + 1}`}
          className={`h-11 w-11 items-center justify-center rounded-lg ${isComplete ? 'bg-positive' : 'bg-surface-sunken'}`}>
          <Ionicons
            name="checkmark"
            size={20}
            color={isComplete ? 'white' : 'rgb(113,113,122)'}
          />
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
}
