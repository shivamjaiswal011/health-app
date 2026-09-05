import { describe, expect, it } from 'vitest';

import {
  formatWeight,
  toDisplayWeight,
  toKilograms,
  formatWeightTotal,
  formatWeightChange,
} from './weight';

describe('toKilograms', () => {
  it('leaves kilograms alone', () => {
    expect(toKilograms(60, 'kg')).toBe(60);
  });

  it('converts pounds', () => {
    expect(toKilograms(45, 'lb')).toBeCloseTo(20.41, 2);
  });
});

describe('round trip', () => {
  it.each([45, 135, 2.5, 315])('returns %s lb unchanged after a round trip', (pounds) => {
    expect(toDisplayWeight(toKilograms(pounds, 'lb'), 'lb')).toBe(pounds);
  });

  it.each([60, 2.5, 102.5])('returns %s kg unchanged after a round trip', (kilos) => {
    expect(toDisplayWeight(toKilograms(kilos, 'kg'), 'kg')).toBe(kilos);
  });

  it('does not drift across repeated conversions', () => {
    let kilograms = toKilograms(225, 'lb');
    for (let pass = 0; pass < 20; pass += 1) {
      kilograms = toKilograms(toDisplayWeight(kilograms, 'lb'), 'lb');
    }
    expect(toDisplayWeight(kilograms, 'lb')).toBe(225);
  });
});

describe('toDisplayWeight', () => {
  it('shows the same stored weight differently per unit', () => {
    const stored = 60;
    expect(toDisplayWeight(stored, 'kg')).toBe(60);
    expect(toDisplayWeight(stored, 'lb')).toBe(132.3);
  });

  it('rounds display to one decimal', () => {
    expect(toDisplayWeight(20.41166, 'kg')).toBe(20.4);
  });
});

describe('formatWeight', () => {
  it('drops a trailing zero', () => {
    expect(formatWeight(60, 'kg')).toBe('60 kg');
  });

  it('keeps a meaningful decimal', () => {
    expect(formatWeight(62.5, 'kg')).toBe('62.5 kg');
  });

  it('labels the unit it converted to', () => {
    expect(formatWeight(20.4116, 'lb')).toBe('45 lb');
  });
});

describe('formatWeightTotal', () => {
  it('separates thousands and drops the decimal', () => {
    expect(formatWeightTotal(32000, 'kg')).toBe('32,000 kg');
  });

  it('converts before rounding', () => {
    expect(formatWeightTotal(1000, 'lb')).toBe('2,205 lb');
  });
});

describe('formatWeightChange', () => {
  it('signs a gain', () => {
    expect(formatWeightChange(2.5, 'kg')).toBe('+2.5 kg');
  });

  it('signs a loss without doubling the minus', () => {
    expect(formatWeightChange(-2.5, 'kg')).toBe('-2.5 kg');
  });

  it('reads no change as neutral rather than negative', () => {
    expect(formatWeightChange(0, 'kg')).toBe('+0 kg');
  });
});
