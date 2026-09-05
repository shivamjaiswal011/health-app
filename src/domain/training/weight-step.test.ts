import { describe, expect, it } from 'vitest';

import { suggestedStep, suggestedStepKilograms } from './weight-step';

describe('suggestedStep', () => {
  it('uses a plate-sized jump for a barbell', () => {
    expect(suggestedStep('barbell', 'kg')).toBe(2.5);
    expect(suggestedStep('barbell', 'lb')).toBe(5);
  });

  it('uses a smaller jump for dumbbells, where 2.5kg is a big relative step', () => {
    expect(suggestedStep('dumbbell', 'kg')).toBe(1);
    expect(suggestedStep('dumbbell', 'lb')).toBe(2.5);
  });

  it('covers every equipment type', () => {
    const every = [
      'barbell',
      'dumbbell',
      'machine',
      'cable',
      'bodyweight',
      'kettlebell',
      'band',
      'other',
    ] as const;
    for (const equipment of every) {
      expect(suggestedStep(equipment, 'kg')).toBeGreaterThan(0);
    }
  });
});

describe('suggestedStepKilograms', () => {
  it('leaves a kilogram step alone', () => {
    expect(suggestedStepKilograms('barbell', 'kg')).toBe(2.5);
  });

  it('converts a pound step for storage', () => {
    expect(suggestedStepKilograms('barbell', 'lb')).toBeCloseTo(2.268, 3);
  });
});
