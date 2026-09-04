import { describe, expect, it } from 'vitest';

import { bestOneRepMaxByDay, type PerformedSetRecord } from './strength-series';

function set(day: number, weightKg: number | null, reps: number | null): PerformedSetRecord {
  return { completedAt: new Date(2026, 8, day, 10, 0), weightKg, reps };
}

describe('bestOneRepMaxByDay', () => {
  it('keeps the best set of the day, not the last', () => {
    const series = bestOneRepMaxByDay([set(1, 100, 5), set(1, 60, 5)]);

    expect(series).toHaveLength(1);
    expect(series[0].value).toBeCloseTo(116.67, 1);
  });

  it('ignores warm-ups that would drag a strong day down', () => {
    const heavyOnly = bestOneRepMaxByDay([set(1, 120, 3)]);
    const withWarmups = bestOneRepMaxByDay([set(1, 40, 10), set(1, 80, 5), set(1, 120, 3)]);

    expect(withWarmups[0].value).toBe(heavyOnly[0].value);
  });

  it('produces one point per training day, in order', () => {
    const series = bestOneRepMaxByDay([set(3, 100, 5), set(1, 90, 5), set(2, 95, 5)]);

    expect(series).toHaveLength(3);
    expect(series.map((point) => point.at)).toEqual([...series.map((p) => p.at)].sort());
  });

  it('omits a day whose sets yield no estimate rather than plotting zero', () => {
    expect(bestOneRepMaxByDay([set(1, null, 10), set(1, 0, 12)])).toEqual([]);
  });

  it('ignores sets that were never completed', () => {
    const incomplete: PerformedSetRecord = { completedAt: null, weightKg: 100, reps: 5 };
    expect(bestOneRepMaxByDay([incomplete])).toEqual([]);
  });

  it('has nothing to show for an exercise never trained', () => {
    expect(bestOneRepMaxByDay([])).toEqual([]);
  });
});
