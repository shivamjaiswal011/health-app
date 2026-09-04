import type { LoggedMacros } from './macros';
import { toOneDecimal as round } from './rounding';

export type RecipeIngredient = LoggedMacros & {
  grams: number;
};

export type ServingComposition = {
  totalGrams: number;
  perServing: LoggedMacros;
  gramsPerServing: number;
};

const NO_SERVINGS: ServingComposition = {
  totalGrams: 0,
  gramsPerServing: 0,
  perServing: { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: null },
};

/**
 * Divides a recipe into servings. Fibre stays unknown rather than becoming zero when
 * any ingredient did not report it — a total that quietly treats missing data as none
 * would understate it without saying so.
 */
export function composeServing(
  ingredients: RecipeIngredient[],
  servings: number,
): ServingComposition {
  if (ingredients.length === 0 || servings <= 0) return NO_SERVINGS;

  const totals = ingredients.reduce(
    (running, item) => ({
      grams: running.grams + item.grams,
      kcal: running.kcal + item.kcal,
      protein: running.protein + item.protein,
      carbs: running.carbs + item.carbs,
      fat: running.fat + item.fat,
    }),
    { grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const fibreKnown = ingredients.every((item) => item.fiber !== null);
  const fibre = fibreKnown
    ? ingredients.reduce((running, item) => running + (item.fiber ?? 0), 0)
    : null;

  return {
    totalGrams: round(totals.grams),
    gramsPerServing: round(totals.grams / servings),
    perServing: {
      kcal: round(totals.kcal / servings),
      protein: round(totals.protein / servings),
      carbs: round(totals.carbs / servings),
      fat: round(totals.fat / servings),
      fiber: fibre === null ? null : round(fibre / servings),
    },
  };
}
