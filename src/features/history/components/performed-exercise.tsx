import { Text, View } from 'react-native';

import { formatWeight } from '@/domain/units/weight';

import type { PerformedSetRow } from '../use-past-session';

/** How a single set read when it was done. Bodyweight sets carry reps alone. */
function setLine(set: PerformedSetRow): string {
  if (set.reps === null) return '—';
  if (set.weightKg === null) return `${set.reps} reps`;
  return `${formatWeight(set.weightKg, set.weightUnit)} × ${set.reps}`;
}

function SetLine({ set, index }: { set: PerformedSetRow; index: number }) {
  const isBackoff = set.setType === 'backoff';

  return (
    <View className="flex-row items-center gap-3 py-2">
      <Text className="w-6 text-center text-sm font-semibold text-content-muted">
        {isBackoff ? 'B' : index + 1}
      </Text>
      <Text className="flex-1 text-[15px] text-content">{setLine(set)}</Text>
      {isBackoff ? <Text className="text-[12px] text-content-faint">back-off</Text> : null}
    </View>
  );
}

type PerformedExerciseProps = {
  name: string;
  sets: PerformedSetRow[];
  isLast: boolean;
};

/**
 * One exercise as it was performed. Sets that were never ticked off are left out
 * entirely — an untouched row is a set the lifter did not do, and listing it as a
 * blank would misreport the session.
 */
export function PerformedExercise({ name, sets, isLast }: PerformedExerciseProps) {
  return (
    <View className={`py-3 ${isLast ? '' : 'border-b border-line'}`}>
      <Text className="pb-1 text-[15px] font-semibold text-content">{name}</Text>
      {sets.length === 0 ? (
        <Text className="py-1 text-[13px] text-content-faint">Nothing recorded</Text>
      ) : (
        sets.map((set, index) => <SetLine key={set.id} set={set} index={index} />)
      )}
    </View>
  );
}
