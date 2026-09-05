import { describe, expect, it } from 'vitest';

import { underfuelledTrainingDays } from './cross-domain-rules';
import { evaluateInsights } from './evaluate';
import { emptyContext, nutritionDays } from './insight-fixtures';

describe('underfuelledTrainingDays', () => {
  it('reports eating less on the days that demand most', () => {
    const nutrition = nutritionDays([1800, 2600, 1800, 2600, 1800, 2600, 1750, 2600]);
    const trainingDays = new Set(nutrition.filter((_, index) => index % 2 === 0).map((d) => d.day));

    const insight = underfuelledTrainingDays({ ...emptyContext(), nutrition, trainingDays });

    expect(insight?.title).toContain('training days');
    expect(insight?.evidence).toContain('kcal fewer');
  });

  it('accepts eating the same on both', () => {
    const nutrition = nutritionDays([2200, 2200, 2200, 2200, 2200, 2200]);
    const trainingDays = new Set(nutrition.filter((_, index) => index % 2 === 0).map((d) => d.day));

    expect(underfuelledTrainingDays({ ...emptyContext(), nutrition, trainingDays })).toBeNull();
  });

  it('waits for enough of both kinds of day', () => {
    const nutrition = nutritionDays([1500, 2600]);
    const trainingDays = new Set([nutrition[0].day]);

    expect(underfuelledTrainingDays({ ...emptyContext(), nutrition, trainingDays })).toBeNull();
  });
});

describe('evaluateInsights', () => {
  it('finds nothing to say about an empty history', () => {
    expect(evaluateInsights(emptyContext())).toEqual([]);
  });

  it('shows at most a handful at once', () => {
    const always = Array.from({ length: 10 }, (_, index) => () => ({
      id: `rule-${index}`,
      title: 'Something',
      evidence: 'Because',
      tone: 'neutral' as const,
    }));

    expect(evaluateInsights(emptyContext(), always)).toHaveLength(4);
  });

  it('skips a rule that throws rather than losing the whole dashboard', () => {
    const broken = () => {
      throw new Error('bad rule');
    };
    const working = () => ({
      id: 'fine',
      title: 'Fine',
      evidence: 'Because',
      tone: 'neutral' as const,
    });

    expect(evaluateInsights(emptyContext(), [broken, working])).toHaveLength(1);
  });

  it('gives every insight evidence to back it up', () => {
    const context = {
      ...emptyContext(),
      target: { kcal: 2400, proteinGrams: 160 },
      nutrition: nutritionDays([2000, 2000, 2000, 2000, 2000, 2000, 2000], 90),
    };

    const insights = evaluateInsights(context);

    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every((insight) => insight.evidence.length > 0)).toBe(true);
  });
});
