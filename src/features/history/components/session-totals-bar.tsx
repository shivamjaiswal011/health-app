import { Text, View } from 'react-native';

import { formatSessionLength } from '@/domain/training/session-totals';
import { formatWeightTotal } from '@/domain/units/weight';
import { displayUnit } from '@/features/settings/units';

type SessionTotalsBarProps = {
  minutes: number | null;
  setCount: number;
  tonnageKg: number;
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xl font-bold text-content">{value}</Text>
      <Text className="mt-0.5 text-[12px] text-content-muted">{label}</Text>
    </View>
  );
}

/** What the session came to, before the set-by-set detail underneath it. */
export function SessionTotalsBar({ minutes, setCount, tonnageKg }: SessionTotalsBarProps) {
  return (
    <View className="mb-4 flex-row rounded-2xl bg-surface-raised px-4 py-4">
      <Stat value={formatSessionLength(minutes)} label="duration" />
      <Stat value={String(setCount)} label={setCount === 1 ? 'set' : 'sets'} />
      <Stat value={formatWeightTotal(tonnageKg, displayUnit())} label="volume" />
    </View>
  );
}
