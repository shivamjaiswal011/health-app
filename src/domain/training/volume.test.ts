import { describe, expect, it } from 'vitest';

import type { CompletedSet } from './types';
import { countSetsPerExercise, setVolume, totalVolume } from './volume';

function completedSet(exerciseId: string, weightKg: number | null, reps: number | null) {
  return { exerciseId, weightKg, reps, completedAt: new Date(0) } satisfies CompletedSet;
}

describe('setVolume', () => {
  it('multiplies load by reps', () => {
    expect(setVolume(60, 10)).toBe(600);
  });

  it.each([
    ['an unloaded bodyweight set', 0, 10],
    ['a set with no reps recorded', 60, null],
    ['a set with no load recorded', null, 10],
  ])('contributes no tonnage for %s', (_label, weight, reps) => {
    expect(setVolume(weight, reps)).toBe(0);
  });
});

describe('totalVolume', () => {
  it('sums tonnage across sets', () => {
    const sets = [completedSet('squat', 100, 5), completedSet('squat', 100, 5)];
    expect(totalVolume(sets)).toBe(1000);
  });

  it('is zero for no sets', () => {
    expect(totalVolume([])).toBe(0);
  });

  it('ignores unloaded sets without discarding the loaded ones', () => {
    const sets = [completedSet('pullup', null, 8), completedSet('squat', 100, 5)];
    expect(totalVolume(sets)).toBe(500);
  });
});

describe('countSetsPerExercise', () => {
  it('counts every set, including unloaded ones', () => {
    const sets = [
      completedSet('pullup', null, 8),
      completedSet('pullup', null, 7),
      completedSet('squat', 100, 5),
    ];

    const counts = countSetsPerExercise(sets);

    expect(counts.get('pullup')).toBe(2);
    expect(counts.get('squat')).toBe(1);
  });

  it('reports nothing for an exercise that was not trained', () => {
    expect(countSetsPerExercise([]).get('squat')).toBeUndefined();
  });
});
