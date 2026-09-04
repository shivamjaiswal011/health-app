import { describe, expect, it } from 'vitest';

import { describeChange, downsample, rollingAverage, type SeriesPoint } from './time-series';

const DAY = 24 * 60 * 60 * 1000;

function daily(values: number[]): SeriesPoint[] {
  return values.map((value, index) => ({ at: index * DAY, value }));
}

describe('rollingAverage', () => {
  it('averages within the trailing window', () => {
    const smoothed = rollingAverage(daily([80, 82, 78]), 7);

    expect(smoothed[0].value).toBe(80);
    expect(smoothed[1].value).toBe(81);
    expect(smoothed[2].value).toBe(80);
  });

  it('drops readings that fall outside the window', () => {
    // Two readings a fortnight apart cannot average together in a 7-day window.
    const points: SeriesPoint[] = [
      { at: 0, value: 80 },
      { at: 14 * DAY, value: 90 },
    ];

    expect(rollingAverage(points, 7)[1].value).toBe(90);
  });

  it('smooths daily water swings out of a flat trend', () => {
    const smoothed = rollingAverage(daily([80, 81, 79, 80, 81, 79, 80]), 7);
    const last = smoothed[smoothed.length - 1].value;

    expect(last).toBeCloseTo(80, 1);
  });

  it('keeps every point', () => {
    expect(rollingAverage(daily([1, 2, 3, 4]), 7)).toHaveLength(4);
  });

  it('returns the series untouched for a nonsensical window', () => {
    const points = daily([1, 2, 3]);
    expect(rollingAverage(points, 0)).toBe(points);
  });

  it('handles an empty series', () => {
    expect(rollingAverage([], 7)).toEqual([]);
  });
});

describe('downsample', () => {
  it('leaves a short series alone', () => {
    const points = daily([1, 2, 3]);
    expect(downsample(points, 10)).toBe(points);
  });

  it('thins a long series to the limit', () => {
    const points = daily(Array.from({ length: 500 }, (_, index) => index));
    expect(downsample(points, 50)).toHaveLength(50);
  });

  it('keeps the first and last reading', () => {
    const points = daily(Array.from({ length: 100 }, (_, index) => index));
    const thinned = downsample(points, 10);

    expect(thinned[0]).toEqual(points[0]);
    expect(thinned[thinned.length - 1]).toEqual(points[points.length - 1]);
  });

  it('preserves chronological order', () => {
    const points = daily(Array.from({ length: 200 }, (_, index) => index));
    const thinned = downsample(points, 20);
    const ascending = thinned.every(
      (point, index) => index === 0 || point.at > thinned[index - 1].at,
    );

    expect(ascending).toBe(true);
  });
});

describe('describeChange', () => {
  it('reports the difference across the series', () => {
    expect(describeChange(daily([80, 78]))).toEqual({ first: 80, last: 78, delta: -2 });
  });

  it('reports nothing from a single reading', () => {
    expect(describeChange(daily([80]))).toBeNull();
  });
});
