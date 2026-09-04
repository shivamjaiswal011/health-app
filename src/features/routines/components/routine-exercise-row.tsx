import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { NumberInput } from '@/ui/number-input';

import type { RoutineExerciseEntry } from '../queries';

type RoutineExerciseRowProps = {
  entry: RoutineExerciseEntry;
  onMove: (direction: -1 | 1) => void;
  onChangeTargetSets: (targetSets: number | null) => void;
  onRemove: () => void;
};

function MoveButton({ direction, onPress }: { direction: -1 | 1; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={direction === -1 ? 'Move up' : 'Move down'}
      className="h-8 w-8 items-center justify-center rounded-md bg-surface-sunken active:opacity-60">
      <Ionicons
        name={direction === -1 ? 'chevron-up' : 'chevron-down'}
        size={16}
        color="rgb(113,113,122)"
      />
    </Pressable>
  );
}

export function RoutineExerciseRow({
  entry,
  onMove,
  onChangeTargetSets,
  onRemove,
}: RoutineExerciseRowProps) {
  return (
    <View className="flex-row items-center gap-3 border-b border-line px-4 py-3">
      <View className="gap-1">
        <MoveButton direction={-1} onPress={() => onMove(-1)} />
        <MoveButton direction={1} onPress={() => onMove(1)} />
      </View>
      <Text className="flex-1 text-base text-content">{entry.name}</Text>
      <View className="w-16">
        <NumberInput
          defaultValue={entry.targetSets}
          onChangeValue={onChangeTargetSets}
          placeholder="sets"
        />
      </View>
      <Pressable onPress={onRemove} accessibilityLabel={`Remove ${entry.name}`} className="p-1">
        <Ionicons name="close" size={20} color="rgb(220,38,38)" />
      </Pressable>
    </View>
  );
}
