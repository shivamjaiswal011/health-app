import { describe, expect, it } from 'vitest';

import {
  loggingLapsed,
  proteinShortfall,
  weekendDivergence,
  weightVersusIntake,
} from './nutrition-rules';
import { emptyContext, nutritionDays, TEST_TODAY } from './insight-fixtures';

describe('proteinShortfall', () => {
  it('reports a week averaging under target', () => {
    const context = {
      ...emptyContext(),
      target: { kcal: 2400, proteinGrams: 160 },
      nutrition: nutritionDays([2000, 2000, 2000, 2000, 2000, 2000, 2000], 110),
    };

    expect(proteinShortfall(context)?.evidence).toContain('110g');
  });

  it('accepts a week close enough to target', () => {
    const context = {
      ...emptyContext(),
      target: { kcal: 2400, proteinGrams: 160 },
      nutrition: nutritionDays([2000, 2000, 2000, 2000, 2000, 2000, 2000], 150),
    };

    expect(proteinShortfall(context)).toBeNull();
  });

  it('says nothing without a target to judge against', () => {
    const context = { ...emptyContext(), nutrition: nutritionDays([2000], 50) };
    expect(proteinShortfall(context)).toBeNull();
  });
});

describe('loggingLapsed', () => {
  it('reports a fortnight with too few logged days', () => {
    const kcal = [2000, 2000, 2000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(loggingLapsed({ ...emptyContext(), nutrition: nutritionDays(kcal) })).not.toBeNull();
  });

  it('stays quiet when logging is consistent', () => {
    const kcal = Array.from({ length: 14 }, () => 2000);
    expect(loggingLapsed({ ...emptyContext(), nutrition: nutritionDays(kcal) })).toBeNull();
  });
});

describe('weekendDivergence', () => {
  it('reports weekends running higher', () => {
    // 2026-08-22 and 23 are a Saturday and Sunday.
    const context = {
      ...emptyContext(),
      nutrition: [
        { day: '2026-08-20', kcal: 2000, protein: 100 },
        { day: '2026-08-21', kcal: 2000, protein: 100 },
        { day: '2026-08-22', kcal: 3200, protein: 100 },
        { day: '2026-08-23', kcal: 3100, protein: 100 },
      ],
    };

    expect(weekendDivergence(context)?.evidence).toContain('2000');
  });

  it('accepts a consistent week', () => {
    const context = {
      ...emptyContext(),
      nutrition: [
        { day: '2026-08-20', kcal: 2000, protein: 100 },
        { day: '2026-08-21', kcal: 2050, protein: 100 },
        { day: '2026-08-22', kcal: 2100, protein: 100 },
        { day: '2026-08-23', kcal: 1950, protein: 100 },
      ],
    };

    expect(weekendDivergence(context)).toBeNull();
  });
});

describe('weightVersusIntake', () => {
  const losingTrend = [
    { at: new Date('2026-08-21').getTime(), value: 82 },
    { at: new Date(TEST_TODAY).getTime(), value: 80 },
  ];

  it('reconciles the scale against what was logged', () => {
    const context = {
      ...emptyContext(),
      target: { kcal: 2400, proteinGrams: 160 },
      bodyWeightTrend: losingTrend,
      nutrition: nutritionDays([2200, 2200, 2200, 2200, 2200, 2200, 2200]),
    };

    const insight = weightVersusIntake(context);
    expect(insight?.title).toContain('losing');
    expect(insight?.evidence).toContain('2200');
  });

  it('stays quiet when weight has barely moved', () => {
    const flat = [
      { at: new Date('2026-08-21').getTime(), value: 80 },
      { at: new Date(TEST_TODAY).getTime(), value: 80.1 },
    ];
    const context = {
      ...emptyContext(),
      target: { kcal: 2400, proteinGrams: 160 },
      bodyWeightTrend: flat,
      nutrition: nutritionDays([2200, 2200, 2200, 2200, 2200, 2200, 2200]),
    };

    expect(weightVersusIntake(context)).toBeNull();
  });
});

describe('weightVersusIntake wording', () => {
  const losingTrend = [
    { at: new Date('2026-08-21').getTime(), value: 82 },
    { at: new Date(TEST_TODAY).getTime(), value: 80 },
  ];

  function contextEating(kcal: number) {
    return {
      ...emptyContext(),
      target: { kcal: 2400, proteinGrams: 160 },
      bodyWeightTrend: losingTrend,
      nutrition: nutritionDays(Array.from({ length: 7 }, () => kcal)),
    };
  }

  it.each([
    ['well under', 900, 'well under your target'],
    ['just inside', 2300, 'within your target'],
    ['over', 2900, 'above your target'],
  ])('describes eating %s as "%s"', (_label, kcal, expected) => {
    expect(weightVersusIntake(contextEating(kcal))?.evidence).toContain(expected);
  });
});
