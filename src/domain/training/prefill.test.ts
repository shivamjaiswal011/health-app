import { describe, expect, it } from 'vitest';

import { prefillFromPrevious, type PreviousSet } from './prefill';

function lastTime(...sets: [number, number][]): PreviousSet[] {
  return sets.map(([weightKg, reps], position) => ({ position, weightKg, reps }));
}

describe('prefillFromPrevious', () => {
  it('opens each set with what was lifted last time', () => {
    const planned = prefillFromPrevious(3, lastTime([100, 5], [100, 5], [95, 6]));

    expect(planned).toEqual([
      { weightKg: 100, reps: 5 },
      { weightKg: 100, reps: 5 },
      { weightKg: 95, reps: 6 },
    ]);
  });

  it('matches by position, not by order received', () => {
    const shuffled: PreviousSet[] = [
      { position: 1, weightKg: 90, reps: 4 },
      { position: 0, weightKg: 80, reps: 8 },
    ];

    expect(prefillFromPrevious(2, shuffled)).toEqual([
      { weightKg: 80, reps: 8 },
      { weightKg: 90, reps: 4 },
    ]);
  });

  it('leaves blank the sets last session never reached', () => {
    const planned = prefillFromPrevious(4, lastTime([100, 5], [100, 5]));

    expect(planned[2]).toEqual({ weightKg: null, reps: null });
    expect(planned[3]).toEqual({ weightKg: null, reps: null });
  });

  it('ignores extra sets from a longer previous session', () => {
    expect(prefillFromPrevious(2, lastTime([100, 5], [100, 5], [100, 5]))).toHaveLength(2);
  });

  it('opens blank when the exercise has never been done', () => {
    expect(prefillFromPrevious(2, [])).toEqual([
      { weightKg: null, reps: null },
      { weightKg: null, reps: null },
    ]);
  });

  it('carries a bodyweight set forward with its reps and no load', () => {
    const bodyweight: PreviousSet[] = [{ position: 0, weightKg: null, reps: 12 }];
    expect(prefillFromPrevious(1, bodyweight)).toEqual([{ weightKg: null, reps: 12 }]);
  });

  it('plans nothing for a nonsensical target', () => {
    expect(prefillFromPrevious(0, lastTime([100, 5]))).toEqual([]);
    expect(prefillFromPrevious(-3, lastTime([100, 5]))).toEqual([]);
  });
});
