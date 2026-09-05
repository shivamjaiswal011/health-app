import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';

import { IconButton } from '@/ui/icon-button';
import { NumberInput } from '@/ui/number-input';
import { useThemeColor } from '@/ui/use-theme-color';

import type { RepRange } from '@/domain/training/challenge';

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

/**
 * The rep range challenge mode ladders through for this exercise, shown only when the
 * mode is on — an off mode's configuration is clutter on a row that is mostly a name.
 *
 * Blank means the configured default, so a lifter who never opens this still gets a
 * range, and one who sets it here overrides only the exercise they set it on.
 */
function RepRangeFields({
  range,
  placeholder,
  onChange,
}: {
  range: Partial<RepRange>;
  placeholder: RepRange;
  onChange: (edit: Partial<RepRange>) => void;
}) {
  return (
    <View className="w-[86px] flex-row items-center gap-1">
      <View className="flex-1">
        <NumberInput
          defaultValue={range.low ?? null}
          onChangeValue={(low) => onChange({ low: low ?? undefined })}
          placeholder={String(placeholder.low)}
        />
      </View>
      <Text className="text-[13px] text-content-faint">–</Text>
      <View className="flex-1">
        <NumberInput
          defaultValue={range.high ?? null}
          onChangeValue={(high) => onChange({ high: high ?? undefined })}
          placeholder={String(placeholder.high)}
        />
      </View>
    </View>
  );
}

export type RoutineExerciseRowProps = {
  entry: RoutineExerciseEntry;
  onChangeTargetSets: (targetSets: number | null) => void;
  onChangeRepRange: (edit: Partial<RepRange>) => void;
  onRemove: () => void;
  isLast: boolean;
  /** Null when challenge mode is off, which hides the rep range entirely. */
  defaultRange: RepRange | null;
};

export function RoutineExerciseRow({
  entry,
  onChangeTargetSets,
  onChangeRepRange,
  onRemove,
  isLast,
  defaultRange,
}: RoutineExerciseRowProps) {
  return (
    <View
      className={`flex-row items-center gap-3 bg-surface-raised py-2.5 pl-3 pr-2 ${
        isLast ? '' : 'border-b border-line'
      }`}>
      <DragHandle />
      <Text className="flex-1 text-base text-content" numberOfLines={2}>
        {entry.name}
      </Text>
      {defaultRange ? (
        <RepRangeFields
          range={{ low: entry.targetRepsLow ?? undefined, high: entry.targetRepsHigh ?? undefined }}
          placeholder={defaultRange}
          onChange={onChangeRepRange}
        />
      ) : null}
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
