import { describe, expect, it } from 'vitest';

import { MUSCLE_GROUPS } from './muscles';
import { repRangeForMuscle, resolveRepRange } from './rep-ranges';

const NOTHING_PINNED = {};

describe('repRangeForMuscle', () => {
  it('ladders the small muscles higher than the heavy compounds', () => {
    expect(repRangeForMuscle('calves').low).toBeGreaterThan(repRangeForMuscle('chest').low);
    expect(repRangeForMuscle('shoulders').low).toBeGreaterThan(repRangeForMuscle('back').low);
  });

  it('gives every muscle a climbable range', () => {
    for (const muscle of MUSCLE_GROUPS) {
      const range = repRangeForMuscle(muscle);
      expect(range.high).toBeGreaterThan(range.low);
    }
  });

  it('keeps every ladder short enough to finish', () => {
    // A range of twelve levels is a year of sessions before the weight ever moves.
    for (const muscle of MUSCLE_GROUPS) {
      const range = repRangeForMuscle(muscle);
      expect(range.high - range.low).toBeLessThanOrEqual(6);
    }
  });
});

describe('resolveRepRange', () => {
  it('falls back to the muscle default when nothing is set', () => {
    const resolved = resolveRepRange({
      pinned: NOTHING_PINNED,
      muscle: 'calves',
      configured: null,
    });

    expect(resolved).toEqual(repRangeForMuscle('calves'));
  });

  it('prefers one configured range over the muscle default', () => {
    const resolved = resolveRepRange({
      pinned: NOTHING_PINNED,
      muscle: 'calves',
      configured: { low: 5, high: 8 },
    });

    expect(resolved).toEqual({ low: 5, high: 8 });
  });

  it('prefers what the lifter pinned on the exercise over everything', () => {
    const resolved = resolveRepRange({
      pinned: { low: 20, high: 30 },
      muscle: 'chest',
      configured: { low: 5, high: 8 },
    });

    expect(resolved).toEqual({ low: 20, high: 30 });
  });

  it('takes a half-pinned range’s missing end from the range below it', () => {
    const resolved = resolveRepRange({ pinned: { high: 20 }, muscle: 'calves', configured: null });

    expect(resolved).toEqual({ low: repRangeForMuscle('calves').low, high: 20 });
  });

  it('discards an inverted range whole rather than climbing backwards', () => {
    const resolved = resolveRepRange({ pinned: { low: 30 }, muscle: 'chest', configured: null });

    expect(resolved).toEqual(repRangeForMuscle('chest'));
  });
});
