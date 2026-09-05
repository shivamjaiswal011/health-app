import { describe, expect, it } from 'vitest';

import { prefillFromPrevious, type PreviousSet } from './prefill';

function lastTime(...sets: [number, number][]): PreviousSet[] {
  return sets.map(([weightKg, reps], position) => ({
    position,
    weightKg,
    weightUnit: 'kg' as const,
    reps,
  }));
}

describe('prefillFromPrevious', () => {
  it('opens each set with what was lifted last time', () => {
    const planned = prefillFromPrevious(3, lastTime([100, 5], [100, 5], [95, 6]), 'kg');

    expect(planned).toEqual([
      { weightKg: 100, weightUnit: 'kg', reps: 5, setType: 'working' },
      { weightKg: 100, weightUnit: 'kg', reps: 5, setType: 'working' },
      { weightKg: 95, weightUnit: 'kg', reps: 6, setType: 'working' },
    ]);
  });

  it('matches by position, not by order received', () => {
    const shuffled: PreviousSet[] = [
      { position: 1, weightKg: 90, weightUnit: 'kg', reps: 4 },
      { position: 0, weightKg: 80, weightUnit: 'kg', reps: 8 },
    ];

    expect(prefillFromPrevious(2, shuffled, 'kg')).toEqual([
      { weightKg: 80, weightUnit: 'kg', reps: 8, setType: 'working' },
      { weightKg: 90, weightUnit: 'kg', reps: 4, setType: 'working' },
    ]);
  });

  it('leaves blank the sets last session never reached', () => {
    const planned = prefillFromPrevious(4, lastTime([100, 5], [100, 5]), 'kg');

    expect(planned[2]).toEqual({ weightKg: null, weightUnit: 'kg', reps: null, setType: 'working' });
    expect(planned[3]).toEqual({ weightKg: null, weightUnit: 'kg', reps: null, setType: 'working' });
  });

  it('ignores extra sets from a longer previous session', () => {
    expect(prefillFromPrevious(2, lastTime([100, 5], [100, 5], [100, 5]), 'kg')).toHaveLength(2);
  });

  it('opens blank when the exercise has never been done', () => {
    expect(prefillFromPrevious(2, [], 'kg')).toEqual([
      { weightKg: null, weightUnit: 'kg', reps: null, setType: 'working' },
      { weightKg: null, weightUnit: 'kg', reps: null, setType: 'working' },
    ]);
  });

  it('carries a bodyweight set forward with its reps and no load', () => {
    const bodyweight: PreviousSet[] = [
      { position: 0, weightKg: null, weightUnit: 'kg', reps: 12 },
    ];
    expect(prefillFromPrevious(1, bodyweight, 'kg')).toEqual([{ weightKg: null, weightUnit: 'kg', reps: 12, setType: 'working' }]);
  });

  it('plans nothing for a nonsensical target', () => {
    expect(prefillFromPrevious(0, lastTime([100, 5]), 'kg')).toEqual([]);
    expect(prefillFromPrevious(-3, lastTime([100, 5]), 'kg')).toEqual([]);
  });
});

describe('units', () => {
  it('keeps each set in the unit it was logged in', () => {
    const inPounds: PreviousSet[] = [{ position: 0, weightKg: 61.2, weightUnit: 'lb', reps: 5 }];

    expect(prefillFromPrevious(1, inPounds, 'kg')[0].weightUnit).toBe('lb');
  });

  it('gives an unreached set the unit the exercise uses, not the app default', () => {
    const inPounds: PreviousSet[] = [{ position: 0, weightKg: 61.2, weightUnit: 'lb', reps: 5 }];

    expect(prefillFromPrevious(2, inPounds, 'kg')[1]).toEqual({
      weightKg: null,
      weightUnit: 'lb',
      reps: null,
      setType: 'working',
    });
  });

  it('falls back to the app default for an exercise never logged', () => {
    expect(prefillFromPrevious(1, [], 'lb')[0].weightUnit).toBe('lb');
  });
});
