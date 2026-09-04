import { View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';

import { MINIMUM_POINTS_TO_CHART } from '@/domain/progress/time-series';

const CHART_HEIGHT = 140;
const BAR_RADIUS = 3;

export type WeeklyVolume = {
  week: string;
  volume: number;
};

type ChartDatum = {
  index: number;
  volume: number;
};

/** Headroom so the tallest bar does not touch the top edge. */
const HEADROOM = 1.05;

/**
 * Weekly tonnage. Bars rather than a line because weeks are discrete buckets — a line
 * would imply training happened continuously between them.
 *
 * The y-axis is pinned to zero. Left to fit the data, it would put the lightest week at
 * zero height and the heaviest at full, turning a 20,000-to-32,000 kg spread into what
 * looks like training from nothing — and making the current, half-finished week read as
 * a collapse.
 */
export function VolumeChart({ weeks, color }: { weeks: WeeklyVolume[]; color: string }) {
  if (weeks.length < MINIMUM_POINTS_TO_CHART) return null;

  const data: ChartDatum[] = weeks.map((entry, index) => ({
    index,
    volume: Math.round(entry.volume),
  }));
  const tallest = Math.max(...data.map((entry) => entry.volume));

  return (
    <View style={{ height: CHART_HEIGHT }}>
      <CartesianChart
        data={data}
        xKey="index"
        yKeys={['volume']}
        domain={{ y: [0, Math.round(tallest * HEADROOM)] }}
        domainPadding={{ left: 12, right: 12 }}>
        {({ points, chartBounds }) => (
          <Bar
            points={points.volume}
            chartBounds={chartBounds}
            color={color}
            roundedCorners={{ topLeft: BAR_RADIUS, topRight: BAR_RADIUS }}
          />
        )}
      </CartesianChart>
    </View>
  );
}
