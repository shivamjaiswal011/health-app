import type { FoodPortion } from './types.mts';

/**
 * A thing you can hold and count: "1 large", "1 slice", "1 fillet". Always the best
 * answer when USDA offers one, because it is how the food is actually eaten.
 */
const NATURAL_UNIT =
  /\b(large|medium|small|whole|piece|slice|fillet|item|unit|jumbo|extra large|breast|thigh|wing|drumstick|link|patty|cookie|bar|packet|egg|fruit|clove|stalk|ear)\b/i;

/** Volume measures: right for rice or milk, wrong for anything countable. */
const VOLUME_UNIT = /\b(cup|bowl|glass|katori|scoop|serving|container|package)\b/i;

/**
 * Spoon and garnish measures. Correct, but nobody eats an egg by the tablespoon, and
 * USDA frequently lists one first.
 */
const MEASURING_UNIT = /\b(tbsp|tsp|tablespoons?|teaspoons?|drop|dash|pinch|fl oz|oz)\b/i;

const IMPLAUSIBLY_SMALL_GRAMS = 10;
const IMPLAUSIBLY_LARGE_GRAMS = 500;

/** Tiers, not bonuses: a natural unit must beat a volume measure outright rather than
 *  risk being out-scored by some other adjustment. */
const TIER = {
  natural: 0,
  volume: 20,
  unrecognised: 40,
  measuring: 100,
} as const;

const PENALTY = { tooSmall: 50, tooLarge: 20 } as const;

function unitTier(label: string): number {
  if (MEASURING_UNIT.test(label)) return TIER.measuring;
  if (NATURAL_UNIT.test(label)) return TIER.natural;
  if (VOLUME_UNIT.test(label)) return TIER.volume;
  return TIER.unrecognised;
}

/**
 * Lower sorts first. USDA lists portions in its own order, which has nothing to do with
 * how anyone eats: for a hard-boiled egg it offers a tablespoon and a cup of chopped egg
 * before "1 large", so taking the first one made a single egg log as 8.5 g.
 */
function portionRank(portion: FoodPortion): number {
  let rank = unitTier(portion.label);
  if (portion.grams < IMPLAUSIBLY_SMALL_GRAMS) rank += PENALTY.tooSmall;
  if (portion.grams > IMPLAUSIBLY_LARGE_GRAMS) rank += PENALTY.tooLarge;
  return rank;
}

/**
 * Orders a food's portions so the most useful one leads, and marks it the default.
 * Ties keep USDA's original order, which is as good a tiebreak as any.
 */
export function withPreferredDefault(portions: FoodPortion[]): FoodPortion[] {
  if (portions.length === 0) return portions;

  const ordered = portions
    .map((portion, index) => ({ portion, index, rank: portionRank(portion) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map((entry) => entry.portion);

  return ordered.map((portion, index) => ({ ...portion, isDefault: index === 0 }));
}
