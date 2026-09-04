import { describe, expect, it } from 'vitest';

import { estimateOneRepMax } from './one-rep-max';

describe('estimateOneRepMax', () => {
  it('returns the lifted weight for a single rep', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });

  it('scales with reps by the Epley formula', () => {
    // 100kg x 5 → 100 * (1 + 5/30) = 116.67
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.67, 2);
  });

  it('rates a heavier set for the same reps higher', () => {
    const lighter = estimateOneRepMax(80, 5);
    const heavier = estimateOneRepMax(100, 5);
    expect(heavier).toBeGreaterThan(lighter!);
  });

  it('rates more reps at the same weight higher', () => {
    expect(estimateOneRepMax(100, 8)!).toBeGreaterThan(estimateOneRepMax(100, 5)!);
  });

  it('refuses to estimate beyond the formula useful range', () => {
    expect(estimateOneRepMax(60, 13)).toBeNull();
  });

  it('estimates at the boundary of the useful range', () => {
    expect(estimateOneRepMax(60, 12)).not.toBeNull();
  });

  it.each([
    ['no weight recorded', null, 5],
    ['no reps recorded', 100, null],
    ['bodyweight set carrying no load', 0, 8],
    ['a set that was never performed', 100, 0],
    ['nonsensical negative load', -20, 5],
  ])('returns null for %s', (_label, weight, reps) => {
    expect(estimateOneRepMax(weight, reps)).toBeNull();
  });
});
