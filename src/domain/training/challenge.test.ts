import { describe, expect, it } from 'vitest';

import {
  backoffSet,
  nextChallenge,
  type PerformedWorkingSet,
  type RepRange,
  planChallengeSets,
  type ChallengePlanRequest,
} from './challenge';

const CURL: RepRange = { low: 8, high: 12 };

function performed(weightKg: number, ...reps: number[]): PerformedWorkingSet[] {
  return reps.map((count) => ({ reps: count, weightKg, weightUnit: 'kg' as const }));
}

describe('nextChallenge', () => {
  it('starts at the bottom of the range with no history', () => {
    const target = nextChallenge(CURL, [], 'kg');

    expect(target).toMatchObject({ targetReps: 8, weightKg: null, level: 1, levels: 5 });
  });

  it('advances one rep when every working set cleared the target', () => {
    expect(nextChallenge(CURL, performed(20, 9, 9, 9), 'kg').targetReps).toBe(10);
  });

  it('re-issues the same target when one set fell short', () => {
    // Targeted 10, managed 10 / 10 / 9 — the ladder does not move.
    expect(nextChallenge(CURL, performed(20, 10, 10, 9), 'kg').targetReps).toBe(10);
  });

  it('judges on the weakest set, not the best', () => {
    expect(nextChallenge(CURL, performed(20, 12, 8, 8), 'kg').targetReps).toBe(9);
  });

  it('treats an unfinished set as no evidence the target was met', () => {
    const withBlank: PerformedWorkingSet[] = [
      { reps: 10, weightKg: 20, weightUnit: 'kg' },
      { reps: null, weightKg: 20, weightUnit: 'kg' },
    ];

    expect(nextChallenge(CURL, withBlank, 'kg').targetReps).toBe(CURL.low);
  });

  it('carries the weight and its unit forward', () => {
    const inPounds: PerformedWorkingSet[] = [{ reps: 9, weightKg: 20.4, weightUnit: 'lb' }];

    expect(nextChallenge(CURL, inPounds, 'kg')).toMatchObject({
      weightKg: 20.4,
      weightUnit: 'lb',
    });
  });

  it('conquers the range at the top and starts again at the bottom', () => {
    const target = nextChallenge(CURL, performed(20, 12, 12, 12), 'kg');

    expect(target.rangeConquered).toBe(true);
    expect(target.targetReps).toBe(8);
    expect(target.level).toBe(1);
  });

  it('conquers when the lifter overshoots the top', () => {
    expect(nextChallenge(CURL, performed(20, 14, 13, 13), 'kg').rangeConquered).toBe(true);
  });

  it('reports the level within the range', () => {
    expect(nextChallenge(CURL, performed(20, 10, 10, 10), 'kg')).toMatchObject({
      level: 4,
      levels: 5,
    });
  });

  it('never targets below the range after a very bad session', () => {
    expect(nextChallenge(CURL, performed(20, 2, 2), 'kg').targetReps).toBe(CURL.low);
  });

  it('handles a single-rep range, where every session either clears or repeats', () => {
    const fixed: RepRange = { low: 5, high: 5 };

    expect(nextChallenge(fixed, performed(60, 4), 'kg').targetReps).toBe(5);
    expect(nextChallenge(fixed, performed(60, 5), 'kg').rangeConquered).toBe(true);
    expect(nextChallenge(fixed, [], 'kg').levels).toBe(1);
  });
});

describe('the full ladder from 8 to 12', () => {
  it('climbs, stalls on a miss, then conquers', () => {
    const steps: { did: number[]; expected: number; conquered?: boolean }[] = [
      { did: [8, 8, 8], expected: 9 },
      { did: [9, 9, 9], expected: 10 },
      { did: [10, 10, 9], expected: 10 }, // missed — re-issued
      { did: [10, 10, 9], expected: 10 }, // missed again — still re-issued
      { did: [10, 10, 10], expected: 11 },
      { did: [11, 11, 11], expected: 12 },
      { did: [12, 12, 12], expected: 8, conquered: true },
    ];

    for (const step of steps) {
      const target = nextChallenge(CURL, performed(20, ...step.did), 'kg');
      expect(target.targetReps).toBe(step.expected);
      expect(target.rangeConquered).toBe(step.conquered ?? false);
    }
  });
});

describe('backoffSet', () => {
  it('runs 20% lighter for four more reps', () => {
    const target = nextChallenge(CURL, performed(20, 9, 9, 9), 'kg');
    const backoff = backoffSet(target);

    expect(backoff.reps).toBe(target.targetReps + 4);
    expect(backoff.weightKg).toBeCloseTo(16, 5);
  });

  it('asks only for extra reps on a bodyweight exercise', () => {
    const target = nextChallenge(CURL, [], 'kg');
    expect(backoffSet(target)).toMatchObject({ weightKg: null, reps: 12 });
  });

  it('keeps the unit the lifter is working in', () => {
    const inPounds: PerformedWorkingSet[] = [{ reps: 9, weightKg: 40, weightUnit: 'lb' }];
    expect(backoffSet(nextChallenge(CURL, inPounds, 'kg')).weightUnit).toBe('lb');
  });
});

describe('planChallengeSets', () => {
  const BENCH: ChallengePlanRequest = {
    range: { low: 8, high: 12 },
    performed: [],
    setCount: 3,
    equipment: 'barbell',
    fallbackUnit: 'kg',
    includeBackoff: false,
  };

  function lastSession(reps: number[], weightKg: number): PerformedWorkingSet[] {
    return reps.map((count) => ({ reps: count, weightKg, weightUnit: 'kg' as const }));
  }

  it('opens every working set at the same target', () => {
    const { sets } = planChallengeSets({ ...BENCH, performed: lastSession([8, 8, 8], 60) });

    expect(sets).toEqual([
      { weightKg: 60, weightUnit: 'kg', reps: 9, setType: 'working' },
      { weightKg: 60, weightUnit: 'kg', reps: 9, setType: 'working' },
      { weightKg: 60, weightUnit: 'kg', reps: 9, setType: 'working' },
    ]);
  });

  it('adds the smallest loadable jump once the range is conquered', () => {
    const { target, sets } = planChallengeSets({
      ...BENCH,
      performed: lastSession([12, 12, 12], 60),
    });

    expect(target.rangeConquered).toBe(true);
    expect(sets[0]).toMatchObject({ weightKg: 62.5, reps: 8 });
  });

  it('steps a dumbbell lift more gently than a barbell', () => {
    const { sets } = planChallengeSets({
      ...BENCH,
      equipment: 'dumbbell',
      performed: lastSession([12, 12, 12], 20),
    });

    expect(sets[0].weightKg).toBe(21);
  });

  it('steps in the unit the lift is loaded in', () => {
    const inPounds = [{ reps: 12, weightKg: 45.36, weightUnit: 'lb' as const }];
    const { sets } = planChallengeSets({ ...BENCH, performed: inPounds });

    // Five pounds, not 2.5 kg — a machine stacked in pounds cannot take a kilo plate.
    expect(sets[0].weightKg).toBeCloseTo(45.36 + 5 / 2.20462262, 5);
    expect(sets[0].weightUnit).toBe('lb');
  });

  it('appends the back-off set after the working sets when it is on', () => {
    const { sets } = planChallengeSets({
      ...BENCH,
      includeBackoff: true,
      performed: lastSession([8, 8, 8], 60),
    });

    expect(sets).toHaveLength(4);
    expect(sets[3]).toEqual({ weightKg: 48, weightUnit: 'kg', reps: 13, setType: 'backoff' });
  });

  it('backs off from the increased weight, not the weight just retired', () => {
    const { sets } = planChallengeSets({
      ...BENCH,
      includeBackoff: true,
      performed: lastSession([12, 12, 12], 60),
    });

    expect(sets[3].weightKg).toBeCloseTo(62.5 * 0.8, 5);
  });

  it('opens a row even for a routine that never set a target count', () => {
    expect(planChallengeSets({ ...BENCH, setCount: 0 }).sets).toHaveLength(1);
  });

  it('leaves the weight unset for a lift with no history', () => {
    const { sets } = planChallengeSets(BENCH);

    expect(sets[0]).toEqual({ weightKg: null, weightUnit: 'kg', reps: 8, setType: 'working' });
  });
});
