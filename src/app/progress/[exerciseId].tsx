import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import {
  describeChange,
  downsample,
  MINIMUM_POINTS_TO_CHART,
  rollingAverage,
  type SeriesPoint,
} from '@/domain/progress/time-series';
import { bestOneRepMaxByDay } from '@/domain/training/strength-series';
import { TrendChart } from '@/features/progress/components/trend-chart';
import { exerciseHistoryQuery } from '@/features/progress/queries';
import { EmptyState } from '@/ui/empty-state';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';
import { useThemeColor } from '@/ui/use-theme-color';

/** A chart cannot show more points than it has pixels; a year of sessions is fewer. */
const MAX_PLOTTED_SESSIONS = 120;
const TREND_WINDOW_DAYS = 21;

/**
 * Reads from the smoothed trend, not the raw sessions.
 *
 * A single light or technique day would otherwise drop the headline by twenty kilos and
 * announce that the lifter had gone backwards, which is the opposite of what a deload
 * week means. The noisy line is still drawn behind — it is the summary that should not
 * over-react to it.
 */
function EstimatedMaxSummary({ trend }: { trend: SeriesPoint[] }) {
  const change = describeChange(trend);
  const current = trend[trend.length - 1];

  return (
    <View className="pb-2">
      <Text className="text-2xl font-bold text-content">{Math.round(current.value)} kg</Text>
      <Text className="mt-0.5 text-xs text-content-muted">
        estimated one-rep max, smoothed
        {change
          ? ` · ${change.delta >= 0 ? '+' : ''}${Math.round(change.delta)} kg since ${format(trend[0].at, 'd MMM')}`
          : ''}
      </Text>
    </View>
  );
}

export default function ExerciseProgressScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const history = useLiveQuery(exerciseHistoryQuery(decodeURIComponent(exerciseId)));
  const accent = useThemeColor('accent');
  const faint = useThemeColor('contentFaint');

  const sessions = downsample(bestOneRepMaxByDay(history.data), MAX_PLOTTED_SESSIONS);
  const trend = rollingAverage(sessions, TREND_WINDOW_DAYS);

  return (
    <Screen>
      <ScreenHeader left={{ label: 'Back', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Strength</Text>
      <ScrollView contentContainerClassName="px-5 pb-8">
        {sessions.length < MINIMUM_POINTS_TO_CHART ? (
          <EmptyState
            title="Not enough history yet"
            message="Two sessions with weight and reps recorded are needed before a trend means anything."
          />
        ) : (
          <View className="gap-3 rounded-2xl border border-line bg-surface-raised p-4">
            <EstimatedMaxSummary trend={trend} />
            <TrendChart points={sessions} trend={trend} color={faint} trendColor={accent} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
