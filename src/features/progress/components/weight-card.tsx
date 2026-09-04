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
import { Button } from '@/ui/button';
import { announceFailure } from '@/ui/failure';
import { NumberInput } from '@/ui/number-input';
import { Sheet } from '@/ui/sheet';
import { useThemeColor } from '@/ui/use-theme-color';

import { bodyWeightQuery } from '../queries';
import { recordBodyWeight } from '../repository';
import { TrendChart } from './trend-chart';

const TREND_WINDOW_DAYS = 7;

function LogWeightSheet({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const [weightKg, setWeightKg] = useState<number | null>(null);

  function handleSave() {
    if (!weightKg) return;
    recordBodyWeight({ id: newId(), measuredOn: today(), weightKg })
      .then(onDismiss)
      .catch((cause) => announceFailure('Saving your weight', cause));
  }

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Log weight">
      <View className="flex-row items-center gap-3 pb-4">
        <View className="w-28">
          <NumberInput defaultValue={null} onChangeValue={setWeightKg} placeholder="kg" />
        </View>
        <Text className="text-sm text-content-faint">kilograms, today</Text>
      </View>
      <Button label="Save weight" onPress={handleSave} disabled={!weightKg} />
    </Sheet>
  );
}

function ChangeSummary({ trend }: { trend: SeriesPoint[] }) {
  const change = describeChange(trend);
  if (!change) return null;

  const gained = change.delta > 0;
  return (
    <Text className="text-xs text-content-muted">
      {change.last.toFixed(1)} kg now · {gained ? '+' : ''}
      {change.delta.toFixed(1)} kg over this range
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
    <View className="gap-3 rounded-2xl border border-line bg-surface-raised p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-content-faint">
          Bodyweight
        </Text>
        <Pressable onPress={() => setLogging(true)} className="active:opacity-60">
          <Text className="text-sm font-semibold text-accent">Log weight</Text>
        </Pressable>
      </View>

      {points.length < MINIMUM_POINTS_TO_CHART ? (
        <Text className="py-6 text-center text-sm text-content-muted">
          Log your weight on a few days and the trend appears here. The smoothed line is what
          to read — day-to-day swings are mostly water.
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
