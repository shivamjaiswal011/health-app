import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { MINIMUM_POINTS_TO_CHART, type SeriesPoint } from '@/domain/progress/time-series';

const CHART_HEIGHT = 140;
const LINE_WIDTH = 2;
const TREND_WIDTH = 3;

type ChartDatum = {
  at: number;
  value: number;
  trend: number;
};

/**
 * Pairs a raw series with its smoothed trend on one set of axes.
 *
 * Deliberately axis-free: labelling axes in Skia needs a loaded font, and at this size
 * the numbers that matter — where it started, where it is now, the change — read better
 * as text beside the chart than as tick marks inside it.
 */
export function TrendChart({
  points,
  trend,
  color,
  trendColor,
}: {
  points: SeriesPoint[];
  trend: SeriesPoint[];
  color: string;
  trendColor: string;
}) {
  if (points.length < MINIMUM_POINTS_TO_CHART) return null;

  const data: ChartDatum[] = points.map((point, index) => ({
    at: point.at,
    value: point.value,
    trend: trend[index]?.value ?? point.value,
  }));

  return (
    <View style={{ height: CHART_HEIGHT }}>
      <CartesianChart data={data} xKey="at" yKeys={['value', 'trend']}>
        {({ points: rendered }) => (
          <>
            <Line points={rendered.value} color={color} strokeWidth={LINE_WIDTH} opacity={0.35} />
            <Line points={rendered.trend} color={trendColor} strokeWidth={TREND_WIDTH} />
          </>
        )}
      </CartesianChart>
    </View>
  );
}
