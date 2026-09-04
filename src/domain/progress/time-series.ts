const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
export const MILLISECONDS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

/**
 * A single reading is a fact, not a trend. Every chart refuses to draw below this,
 * and says why instead of showing a misleading dot.
 */
export const MINIMUM_POINTS_TO_CHART = 2;

export type SeriesPoint = {
  /** Epoch milliseconds. */
  at: number;
  value: number;
};

/**
 * Trailing average over a window of days.
 *
 * Bodyweight swings by a kilogram or more day to day on water alone, so the raw line
 * says almost nothing about whether someone is actually gaining or losing. The window
 * is measured in days rather than in readings because people weigh themselves
 * irregularly — five readings might span a week or a month.
 */
export function rollingAverage(points: SeriesPoint[], windowDays: number): SeriesPoint[] {
  if (windowDays <= 0) return points;
  const windowMs = windowDays * MILLISECONDS_PER_DAY;
  const averaged: SeriesPoint[] = [];
  let windowStart = 0;
  let runningTotal = 0;

  for (let index = 0; index < points.length; index += 1) {
    runningTotal += points[index].value;
    while (points[index].at - points[windowStart].at > windowMs) {
      runningTotal -= points[windowStart].value;
      windowStart += 1;
    }
    const count = index - windowStart + 1;
    averaged.push({ at: points[index].at, value: runningTotal / count });
  }

  return averaged;
}

/**
 * Thins a series to at most `maxPoints`, always keeping the first and last.
 *
 * A chart cannot show more points than it has pixels, and handing a year of daily
 * readings to the renderer costs work that no one can see. Endpoints are preserved
 * because a trimmed start or end would visibly shorten the range.
 */
export function downsample(points: SeriesPoint[], maxPoints: number): SeriesPoint[] {
  if (maxPoints < MINIMUM_POINTS_TO_CHART || points.length <= maxPoints) return points;

  const step = (points.length - 1) / (maxPoints - 1);
  const thinned: SeriesPoint[] = [];
  for (let slot = 0; slot < maxPoints; slot += 1) {
    thinned.push(points[Math.round(slot * step)]);
  }
  return thinned;
}

export type SeriesChange = {
  first: number;
  last: number;
  delta: number;
};

/** Start, end and difference across a series — the summary line above a chart. */
export function describeChange(points: SeriesPoint[]): SeriesChange | null {
  if (points.length < MINIMUM_POINTS_TO_CHART) return null;
  const first = points[0].value;
  const last = points[points.length - 1].value;
  return { first, last, delta: last - first };
}
