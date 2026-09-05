import { toOneDecimal as round } from './rounding';

const GRAMS_PER_100G = 100;

export type Macros = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type PerHundredGrams = Macros & {
  fiber: number | null;
};

export type LoggedMacros = Macros & {
  fiber: number | null;
};

export const NO_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/**
 * What a given weight of a food contributes. Rounded to one decimal because the
 * underlying composition is an estimate and false precision invites the user to
 * trust it further than they should.
 */
export function macrosForGrams(per100g: PerHundredGrams, grams: number): LoggedMacros {
  const factor = grams / GRAMS_PER_100G;
  return {
    kcal: round(per100g.kcal * factor),
    protein: round(per100g.protein * factor),
    carbs: round(per100g.carbs * factor),
    fat: round(per100g.fat * factor),
    fiber: per100g.fiber === null ? null : round(per100g.fiber * factor),
  };
}

export function sumMacros(entries: Macros[]): Macros {
  const total = entries.reduce(
    (running, entry) => ({
      kcal: running.kcal + entry.kcal,
      protein: running.protein + entry.protein,
      carbs: running.carbs + entry.carbs,
      fat: running.fat + entry.fat,
    }),
    NO_MACROS,
  );
  return {
    kcal: round(total.kcal),
    protein: round(total.protein),
    carbs: round(total.carbs),
    fat: round(total.fat),
  };
}

/**
 * Progress toward a target, uncapped: going over matters as much as falling short, so
 * this deliberately returns more than 1 rather than clamping. Callers cap the bar,
 * not the number.
 */
export function progressToward(consumed: number, target: number): number {
  if (target <= 0) return 0;
  return consumed / target;
}
