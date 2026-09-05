import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';

import { IconButton } from '@/ui/icon-button';
import { NumberInput } from '@/ui/number-input';
import { useThemeColor } from '@/ui/use-theme-color';

import type { RoutineExerciseEntry } from '../queries';

const HANDLE_SIZE = 22;

/**
 * Press-and-hold the handle to drag. Replaces a stacked pair of up/down arrows that
 * took 64pt of row width to move one position at a time, and made reordering a
 * five-exercise routine a chore rather than a gesture.
 */
function DragHandle() {
  const drag = useReorderableDrag();
  const faint = useThemeColor('contentFaint');

  return (
    <Pressable
      onLongPress={drag}
      delayLongPress={120}
      accessibilityLabel="Drag to reorder"
      hitSlop={12}
      className="w-7 items-start py-2 active:opacity-50">
      <Ionicons name="reorder-three-outline" size={HANDLE_SIZE} color={faint} />
    </Pressable>
  );
}

export function RoutineExerciseRow({
  entry,
  onChangeTargetSets,
  onRemove,
  isLast,
}: {
  entry: RoutineExerciseEntry;
  onChangeTargetSets: (targetSets: number | null) => void;
  onRemove: () => void;
  isLast: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 bg-surface-raised py-2.5 pl-3 pr-2 ${
        isLast ? '' : 'border-b border-line'
      }`}>
      <DragHandle />
      <Text className="flex-1 text-base text-content" numberOfLines={2}>
        {entry.name}
      </Text>
      <View className="w-14">
        <NumberInput
          defaultValue={entry.targetSets}
          onChangeValue={onChangeTargetSets}
          placeholder="3"
        />
      </View>
      <IconButton name="close" label={`Remove ${entry.name}`} onPress={onRemove} />
    </View>
  );
}
