import { describe, expect, it } from 'vitest';

import {
  findRecordsBeatenBySet,
  findSessionVolumeRecord,
  type PersonalBests,
} from './personal-records';
import type { CompletedSet } from './types';

const NO_PREVIOUS_RECORDS: PersonalBests = {
  heaviestWeightKg: null,
  bestEstimatedOneRepMax: null,
  bestSessionVolume: null,
};

function completedSet(weightKg: number | null, reps: number | null): CompletedSet {
  return { exerciseId: 'bench', weightKg, reps, completedAt: new Date(0) };
}

describe('findRecordsBeatenBySet', () => {
  it('treats a first ever set as beating both per-set records', () => {
    const beaten = findRecordsBeatenBySet(NO_PREVIOUS_RECORDS, completedSet(100, 5));
    expect(beaten.map((record) => record.kind)).toEqual([
      'heaviest_weight',
      'best_estimated_1rm',
    ]);
  });

  it('reports no record when the set matches the existing mark exactly', () => {
    const previous: PersonalBests = {
      heaviestWeightKg: 100,
      bestEstimatedOneRepMax: 100,
      bestSessionVolume: null,
    };
    expect(findRecordsBeatenBySet(previous, completedSet(100, 1))).toEqual([]);
  });

  it('recognises a heavier single even when the estimate does not improve', () => {
    const previous: PersonalBests = {
      heaviestWeightKg: 100,
      bestEstimatedOneRepMax: 140,
      bestSessionVolume: null,
    };

    const beaten = findRecordsBeatenBySet(previous, completedSet(110, 1));

    expect(beaten).toEqual([{ kind: 'heaviest_weight', value: 110 }]);
  });

  it('recognises a better estimate from a lighter, longer set', () => {
    const previous: PersonalBests = {
      heaviestWeightKg: 120,
      bestEstimatedOneRepMax: 120,
      bestSessionVolume: null,
    };

    const beaten = findRecordsBeatenBySet(previous, completedSet(110, 5));

    expect(beaten.map((record) => record.kind)).toEqual(['best_estimated_1rm']);
  });

  it('ignores a set that was never completed', () => {
    expect(findRecordsBeatenBySet(NO_PREVIOUS_RECORDS, completedSet(100, null))).toEqual([]);
  });

  it('does not award a weight record to an unloaded bodyweight set', () => {
    expect(findRecordsBeatenBySet(NO_PREVIOUS_RECORDS, completedSet(0, 10))).toEqual([]);
  });
});

describe('findSessionVolumeRecord', () => {
  it('records the first session with any tonnage', () => {
    expect(findSessionVolumeRecord(NO_PREVIOUS_RECORDS, 5000)).toEqual({
      kind: 'best_session_volume',
      value: 5000,
    });
  });

  it('ignores a session that did not beat the previous best', () => {
    const previous = { ...NO_PREVIOUS_RECORDS, bestSessionVolume: 6000 };
    expect(findSessionVolumeRecord(previous, 5000)).toBeNull();
  });

  it('ignores a session with no tonnage at all', () => {
    expect(findSessionVolumeRecord(NO_PREVIOUS_RECORDS, 0)).toBeNull();
  });
});
