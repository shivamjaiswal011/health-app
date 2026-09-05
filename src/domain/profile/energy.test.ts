import { describe, expect, it } from 'vitest';

import { maintenanceEnergy, restingEnergy, targetEnergy, type Profile } from './energy';

const LIFTER: Profile = {
  sex: 'male',
  ageYears: 30,
  heightCm: 178,
  weightKg: 80,
  activity: 'moderate',
  goal: 'maintain',
};

describe('restingEnergy', () => {
  it('matches Mifflin-St Jeor for a man', () => {
    // 10*80 + 6.25*178 - 5*30 + 5 = 1767.5
    expect(restingEnergy(LIFTER)).toBe(1768);
  });

  it('matches Mifflin-St Jeor for a woman', () => {
    // 10*65 + 6.25*165 - 5*30 - 161 = 1370.25
    expect(restingEnergy({ ...LIFTER, sex: 'female', weightKg: 65, heightCm: 165 })).toBe(1370);
  });

  it('falls with age', () => {
    expect(restingEnergy({ ...LIFTER, ageYears: 60 })).toBeLessThan(restingEnergy(LIFTER));
  });

  it('rises with weight', () => {
    expect(restingEnergy({ ...LIFTER, weightKg: 95 })).toBeGreaterThan(restingEnergy(LIFTER));
  });
});

describe('maintenanceEnergy', () => {
  it('scales resting rate by activity', () => {
    expect(maintenanceEnergy(LIFTER)).toBe(Math.round(1768 * 1.55));
  });

  it('rises monotonically across activity levels', () => {
    const levels = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
    const values = levels.map((activity) => maintenanceEnergy({ ...LIFTER, activity }));
    const ascending = values.every((value, i) => i === 0 || value > values[i - 1]);
    expect(ascending).toBe(true);
  });
});

describe('targetEnergy', () => {
  it('leaves maintenance alone', () => {
    expect(targetEnergy(LIFTER)).toBe(maintenanceEnergy(LIFTER));
  });

  it('takes energy off to lose', () => {
    expect(targetEnergy({ ...LIFTER, goal: 'lose' })).toBe(maintenanceEnergy(LIFTER) - 500);
  });

  it('adds less to gain than it removes to lose', () => {
    const surplus = targetEnergy({ ...LIFTER, goal: 'gain' }) - maintenanceEnergy(LIFTER);
    const deficit = maintenanceEnergy(LIFTER) - targetEnergy({ ...LIFTER, goal: 'lose' });
    expect(surplus).toBeLessThan(deficit);
  });

  it('never suggests a dangerous target, however small the person', () => {
    const tiny: Profile = {
      sex: 'female',
      ageYears: 70,
      heightCm: 145,
      weightKg: 40,
      activity: 'sedentary',
      goal: 'lose',
    };
    expect(targetEnergy(tiny)).toBeGreaterThanOrEqual(1200);
  });
});
