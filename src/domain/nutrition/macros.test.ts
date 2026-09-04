import { describe, expect, it } from 'vitest';

import { macrosForGrams, progressToward, sumMacros, type PerHundredGrams } from './macros';

const ROTI: PerHundredGrams = { kcal: 299, protein: 11.6, carbs: 63, fat: 2.2, fiber: 9.5 };

describe('macrosForGrams', () => {
  it('returns the per-100g figures unchanged for 100g', () => {
    expect(macrosForGrams(ROTI, 100)).toEqual({
      kcal: 299,
      protein: 11.6,
      carbs: 63,
      fat: 2.2,
      fiber: 9.5,
    });
  });

  it('scales down for a single roti', () => {
    const one = macrosForGrams(ROTI, 40);
    expect(one.kcal).toBe(119.6);
    expect(one.protein).toBe(4.6);
  });

  it('scales up beyond 100g', () => {
    expect(macrosForGrams(ROTI, 200).kcal).toBe(598);
  });

  it('contributes nothing for zero grams', () => {
    expect(macrosForGrams(ROTI, 0)).toEqual({
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    });
  });

  it('keeps fibre unknown rather than reporting it as zero', () => {
    const withoutFibre = { ...ROTI, fiber: null };
    expect(macrosForGrams(withoutFibre, 50).fiber).toBeNull();
  });
});

describe('sumMacros', () => {
  it('adds a day of entries', () => {
    const total = sumMacros([
      { kcal: 119.6, protein: 4.6, carbs: 25.2, fat: 0.9 },
      { kcal: 190, protein: 6, carbs: 30, fat: 5 },
    ]);
    expect(total).toEqual({ kcal: 309.6, protein: 10.6, carbs: 55.2, fat: 5.9 });
  });

  it('is zero for a day with nothing logged', () => {
    expect(sumMacros([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('does not accumulate floating point noise', () => {
    const total = sumMacros(Array.from({ length: 3 }, () => ({
      kcal: 0.1,
      protein: 0.1,
      carbs: 0.1,
      fat: 0.1,
    })));
    expect(total.kcal).toBe(0.3);
  });
});

describe('progressToward', () => {
  it('reports a fraction of the target', () => {
    expect(progressToward(1000, 2000)).toBe(0.5);
  });

  it('reports going over the target rather than capping at one', () => {
    expect(progressToward(2500, 2000)).toBe(1.25);
  });

  it('reports no progress when no target is set', () => {
    expect(progressToward(1200, 0)).toBe(0);
  });
});
