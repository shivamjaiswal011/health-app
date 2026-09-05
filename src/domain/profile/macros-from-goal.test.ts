import { describe, expect, it } from 'vitest';

import { targetEnergy, type Profile } from './energy';
import { macrosForProfile } from './macros-from-goal';

const LIFTER: Profile = {
  sex: 'male',
  ageYears: 30,
  heightCm: 178,
  weightKg: 80,
  activity: 'moderate',
  goal: 'maintain',
};

describe('macrosForProfile', () => {
  it('sets protein from bodyweight', () => {
    expect(macrosForProfile(LIFTER).proteinGrams).toBe(Math.round(80 * 1.8));
  });

  it('asks for more protein when cutting', () => {
    const cutting = macrosForProfile({ ...LIFTER, goal: 'lose' });
    expect(cutting.proteinGrams).toBeGreaterThan(macrosForProfile(LIFTER).proteinGrams);
  });

  it('matches the energy target it was built from', () => {
    expect(macrosForProfile(LIFTER).kcal).toBe(targetEnergy(LIFTER));
  });

  it('produces macros that add back up to the calorie target', () => {
    const { kcal, proteinGrams, carbsGrams, fatGrams } = macrosForProfile(LIFTER);
    const fromMacros = proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9;
    // Rounding each macro to whole grams cannot drift more than a few kcal.
    expect(Math.abs(fromMacros - kcal)).toBeLessThan(10);
  });

  it('keeps fat at roughly a quarter of energy', () => {
    const { kcal, fatGrams } = macrosForProfile(LIFTER);
    expect((fatGrams * 9) / kcal).toBeCloseTo(0.25, 2);
  });

  it('never returns negative carbohydrate for a small person cutting', () => {
    const tiny: Profile = {
      sex: 'female',
      ageYears: 70,
      heightCm: 145,
      weightKg: 40,
      activity: 'sedentary',
      goal: 'lose',
    };
    expect(macrosForProfile(tiny).carbsGrams).toBeGreaterThanOrEqual(0);
  });
});
