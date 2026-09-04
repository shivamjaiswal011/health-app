import type { FoodPortion, FoodRecord, Nutrients } from './types.mts';

const GRAMS_PER_100G = 100;

/**
 * Fibre-adjusted Atwater factors. Carbohydrate from USDA is "by difference", which
 * includes fibre; charging fibre the full 4 kcal/g overstates energy in wholegrain and
 * pulse-heavy dishes by 5-8%. Splitting it out reproduces USDA's own energy figures.
 */
const KCAL_PER_GRAM = { protein: 4, digestibleCarb: 4, fibre: 2, fat: 9 } as const;

/**
 * What fraction of a nutrient survives into the finished dish. Only needed where part
 * of an ingredient is discarded — draining whey off paneer takes most of the lactose
 * and the whey protein with it.
 */
export type NutrientRetention = {
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
};

export type DishIngredient = {
  /** A key in INGREDIENTS, or `dish:<id>` to build on an earlier composed dish. */
  ingredient: string;
  grams: number;
  retain?: NutrientRetention;
};

export type DishDefinition = {
  id: string;
  name: string;
  ingredients: DishIngredient[];
  /**
   * What the dish weighs once cooked. Water boiled off or absorbed changes the weight
   * but not the nutrients, so this converts ingredient totals to a per-100g basis.
   * Getting it wrong scales every macro, so each is a considered estimate.
   */
  cookedGrams: number;
  portions: FoodPortion[];
};

const NOTHING: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

function contribution(source: Nutrients, part: DishIngredient): Nutrients {
  const factor = part.grams / GRAMS_PER_100G;
  const keep = part.retain ?? {};
  return {
    kcal: 0, // recomputed from macros once the dish is whole
    protein: source.protein * factor * (keep.protein ?? 1),
    carbs: source.carbs * factor * (keep.carbs ?? 1),
    fat: source.fat * factor * (keep.fat ?? 1),
    fiber: (source.fiber ?? 0) * factor * (keep.fiber ?? 1),
  };
}

function add(running: Nutrients, extra: Nutrients): Nutrients {
  return {
    kcal: 0,
    protein: running.protein + extra.protein,
    carbs: running.carbs + extra.carbs,
    fat: running.fat + extra.fat,
    fiber: (running.fiber ?? 0) + (extra.fiber ?? 0),
  };
}

function energyOf(nutrients: Nutrients): number {
  const fibre = nutrients.fiber ?? 0;
  const digestibleCarb = Math.max(0, nutrients.carbs - fibre);
  return (
    nutrients.protein * KCAL_PER_GRAM.protein +
    digestibleCarb * KCAL_PER_GRAM.digestibleCarb +
    fibre * KCAL_PER_GRAM.fibre +
    nutrients.fat * KCAL_PER_GRAM.fat
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function perHundredGrams(total: Nutrients, cookedGrams: number): Nutrients {
  const factor = GRAMS_PER_100G / cookedGrams;
  const scaled = {
    kcal: 0,
    protein: total.protein * factor,
    carbs: total.carbs * factor,
    fat: total.fat * factor,
    fiber: (total.fiber ?? 0) * factor,
  };
  return {
    kcal: round(energyOf(scaled)),
    protein: round(scaled.protein),
    carbs: round(scaled.carbs),
    fat: round(scaled.fat),
    fiber: round(scaled.fiber ?? 0),
  };
}

/**
 * Builds a dish's composition by summing its ingredients and dividing by the cooked
 * weight. Deriving a dish from public-domain ingredient data makes the result our own
 * work rather than a redistribution of someone else's table.
 */
export function composeDish(
  dish: DishDefinition,
  ingredients: Map<string, FoodRecord>,
): FoodRecord {
  let total = NOTHING;
  for (const part of dish.ingredients) {
    const source = ingredients.get(part.ingredient);
    if (!source) throw new Error(`${dish.name}: unknown ingredient "${part.ingredient}"`);
    total = add(total, contribution(source.per100g, part));
  }

  return {
    id: `composed:${dish.id}`,
    name: dish.name,
    source: 'composed',
    per100g: perHundredGrams(total, dish.cookedGrams),
    portions: dish.portions,
  };
}
