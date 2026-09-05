import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { parseISO } from 'date-fns';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { newId } from '@/db/id';
import { today } from '@/domain/nutrition/calendar-day';
import {
  describeChange,
  MINIMUM_POINTS_TO_CHART,
  rollingAverage,
  type SeriesPoint,
} from '@/domain/progress/time-series';
import { formatWeight, formatWeightChange, toKilograms } from '@/domain/units/weight';
import { bodyweightUnit } from '@/features/settings/units';
import { Button } from '@/ui/button';
import { announceFailure } from '@/ui/failure';
import { NumberInput } from '@/ui/number-input';
import { Sheet } from '@/ui/sheet';
import { useThemeColor } from '@/ui/use-theme-color';

import { bodyWeightQuery } from '../queries';
import { recordBodyWeight } from '../repository';
import { TrendChart } from './trend-chart';

const TREND_WINDOW_DAYS = 7;

/**
 * A weigh-in is entered in whatever the bathroom scale reads, set once in Settings —
 * unlike a lift, a scale does not change unit between one weigh-in and the next.
 */
function LogWeightSheet({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const [entered, setEntered] = useState<number | null>(null);
  const unit = bodyweightUnit();

  function handleSave() {
    if (!entered) return;
    const weighIn = { id: newId(), measuredOn: today(), weightKg: toKilograms(entered, unit) };
    recordBodyWeight({ ...weighIn, weightUnit: unit })
      .then(onDismiss)
      .catch((cause) => announceFailure('Saving your weight', cause));
  }

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Log weight">
      <View className="flex-row items-center gap-3 pb-4">
        <View className="w-28">
          <NumberInput defaultValue={null} onChangeValue={setEntered} placeholder={unit} />
        </View>
        <Text className="text-sm text-content-faint">{unit}, today</Text>
      </View>
      <Button label="Save weight" onPress={handleSave} disabled={!entered} />
    </Sheet>
  );
}

function ChangeSummary({ trend }: { trend: SeriesPoint[] }) {
  const change = describeChange(trend);
  if (!change) return null;

  const unit = bodyweightUnit();
  return (
    <Text className="text-xs text-content-muted">
      {formatWeight(change.last, unit)} now · {formatWeightChange(change.delta, unit)} over this
      range
    </Text>
  );
}

export function WeightCard() {
  const [logging, setLogging] = useState(false);
  const readings = useLiveQuery(bodyWeightQuery());
  const accent = useThemeColor('accent');
  const faint = useThemeColor('contentFaint');

  const points: SeriesPoint[] = readings.data
    .filter((row) => row.weightKg !== null)
    .map((row) => ({ at: parseISO(row.measuredOn).getTime(), value: row.weightKg as number }));
  const trend = rollingAverage(points, TREND_WINDOW_DAYS);

  return (
    <View className="gap-3 rounded-2xl bg-surface-raised p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-[15px] font-semibold text-content">Bodyweight</Text>
        <Pressable onPress={() => setLogging(true)} className="active:opacity-60">
          <Text className="text-sm font-semibold text-accent">Log weight</Text>
        </Pressable>
      </View>

      {points.length < MINIMUM_POINTS_TO_CHART ? (
        <Text className="pb-2 pt-1 text-[15px] leading-[21px] text-content-muted">
          Log your weight on a few days and the trend appears here. The smoothed line is what to
          read — day-to-day swings are mostly water.
        </Text>
      ) : (
        <>
          <ChangeSummary trend={trend} />
          <TrendChart points={points} trend={trend} color={faint} trendColor={accent} />
        </>
      )}

      <LogWeightSheet visible={logging} onDismiss={() => setLogging(false)} />
    </View>
  );
}
