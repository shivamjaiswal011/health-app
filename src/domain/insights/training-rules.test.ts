import { describe, expect, it } from 'vitest';


import {
  decliningVolume,
  neglectedMuscle,
  pushPullImbalance,
  recentProgress,
  stagnantLift,
} from './training-rules';
import {
  emptyContext,
  sessions,
  TEST_TODAY,
} from './insight-fixtures';


describe('stagnantLift', () => {
  it('reports a lift with no new best for several sessions', () => {
    const context = {
      ...emptyContext(),
      lifts: [{ exerciseId: 'bench', name: 'Bench Press', sessions: sessions([100, 90, 92, 91, 89]) }],
    };

    const insight = stagnantLift(context);

    expect(insight?.title).toContain('Bench Press');
    expect(insight?.evidence).toContain('4 sessions');
  });

  it('stays quiet while a lift is still improving', () => {
    const context = {
      ...emptyContext(),
      lifts: [{ exerciseId: 'bench', name: 'Bench', sessions: sessions([90, 92, 95, 97, 100]) }],
    };

    expect(stagnantLift(context)).toBeNull();
  });

  it('stays quiet before there is enough history to judge', () => {
    const context = {
      ...emptyContext(),
      lifts: [{ exerciseId: 'bench', name: 'Bench', sessions: sessions([100, 90]) }],
    };

    expect(stagnantLift(context)).toBeNull();
  });
});

describe('recentProgress', () => {
  it('celebrates a lift at its best in a recent session', () => {
    const context = {
      ...emptyContext(),
      lifts: [{ exerciseId: 'squat', name: 'Back Squat', sessions: sessions([100, 105, 112]) }],
    };

    const insight = recentProgress(context);

    expect(insight?.tone).toBe('positive');
    expect(insight?.evidence).toContain('12 kg');
  });

  it('stays quiet when the best day was months ago', () => {
    const stale = [
      { at: new Date('2026-05-01').getTime(), value: 100 },
      { at: new Date('2026-05-10').getTime(), value: 120 },
    ];
    const context = {
      ...emptyContext(),
      lifts: [{ exerciseId: 'squat', name: 'Back Squat', sessions: stale }],
    };

    expect(recentProgress(context)).toBeNull();
  });

  it('stays quiet when the latest session is not the best', () => {
    const context = {
      ...emptyContext(),
      lifts: [{ exerciseId: 'squat', name: 'Back Squat', sessions: sessions([120, 110, 105]) }],
    };

    expect(recentProgress(context)).toBeNull();
  });
});

describe('decliningVolume', () => {
  it('reports three weeks of falling set counts', () => {
    const context = {
      ...emptyContext(),
      weeks: [
        { week: '2026-31', sets: 60 },
        { week: '2026-32', sets: 50 },
        { week: '2026-33', sets: 40 },
        { week: '2026-34', sets: 30 },
      ],
    };

    expect(decliningVolume(context)?.evidence).toContain('60');
  });

  it('ignores a single down week', () => {
    const context = {
      ...emptyContext(),
      weeks: [
        { week: '2026-31', sets: 40 },
        { week: '2026-32', sets: 50 },
        { week: '2026-33', sets: 60 },
        { week: '2026-34', sets: 55 },
      ],
    };

    expect(decliningVolume(context)).toBeNull();
  });
});

describe('pushPullImbalance', () => {
  it('reports pushing far more than pulling', () => {
    const context = {
      ...emptyContext(),
      muscles: [
        { muscle: 'chest', setsLast14Days: 30, lastTrainedOn: TEST_TODAY },
        { muscle: 'back', setsLast14Days: 8, lastTrainedOn: TEST_TODAY },
      ],
    };

    expect(pushPullImbalance(context)?.title).toContain('pushing');
  });

  it('accepts a balanced fortnight', () => {
    const context = {
      ...emptyContext(),
      muscles: [
        { muscle: 'chest', setsLast14Days: 20, lastTrainedOn: TEST_TODAY },
        { muscle: 'back', setsLast14Days: 20, lastTrainedOn: TEST_TODAY },
      ],
    };

    expect(pushPullImbalance(context)).toBeNull();
  });

  it('says nothing when one side has never been trained', () => {
    const context = {
      ...emptyContext(),
      muscles: [{ muscle: 'chest', setsLast14Days: 20, lastTrainedOn: TEST_TODAY }],
    };

    expect(pushPullImbalance(context)).toBeNull();
  });
});

describe('neglectedMuscle', () => {
  it('reports the muscle left longest', () => {
    const context = {
      ...emptyContext(),
      muscles: [
        { muscle: 'back', setsLast14Days: 0, lastTrainedOn: '2026-08-20' },
        { muscle: 'quads', setsLast14Days: 0, lastTrainedOn: '2026-08-01' },
      ],
    };

    expect(neglectedMuscle(context)?.title).toContain('quads');
  });

  it('ignores a muscle never trained at all', () => {
    const context = {
      ...emptyContext(),
      muscles: [{ muscle: 'calves', setsLast14Days: 0, lastTrainedOn: null }],
    };

    expect(neglectedMuscle(context)).toBeNull();
  });
});
