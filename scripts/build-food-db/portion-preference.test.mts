import { describe, expect, it } from 'vitest';

import { withPreferredDefault } from './portion-preference.mts';

function portion(label: string, grams: number) {
  return { label, grams, isDefault: false };
}

/** The exact list USDA ships for a hard-boiled egg, in its own order. */
const HARD_BOILED_EGG = [
  portion('1 tbsp', 8.5),
  portion('1 cup, chopped', 136),
  portion('1 large', 50),
];

describe('withPreferredDefault', () => {
  it('picks the countable unit over a spoon or a cup', () => {
    const [first] = withPreferredDefault(HARD_BOILED_EGG);
    expect(first.label).toBe('1 large');
    expect(first.isDefault).toBe(true);
  });

  it('marks exactly one default', () => {
    const defaults = withPreferredDefault(HARD_BOILED_EGG).filter((p) => p.isDefault);
    expect(defaults).toHaveLength(1);
  });

  it('keeps every portion on offer', () => {
    expect(withPreferredDefault(HARD_BOILED_EGG)).toHaveLength(3);
  });

  it('falls back to a cup when nothing countable exists', () => {
    const rice = [portion('1 oz', 28), portion('1 cup', 158)];
    expect(withPreferredDefault(rice)[0].label).toBe('1 cup');
  });

  it('still offers a spoon when a spoon is all there is', () => {
    const spice = [portion('1 tsp', 2)];
    expect(withPreferredDefault(spice)[0]).toMatchObject({ label: '1 tsp', isDefault: true });
  });

  it('avoids an implausibly small default when a real one exists', () => {
    const cheese = [portion('1 sprinkle', 1), portion('1 slice', 28)];
    expect(withPreferredDefault(cheese)[0].label).toBe('1 slice');
  });

  it('handles a food with no portions at all', () => {
    expect(withPreferredDefault([])).toEqual([]);
  });
});
