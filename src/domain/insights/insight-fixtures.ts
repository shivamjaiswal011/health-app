import { MILLISECONDS_PER_DAY } from '@/domain/progress/time-series';

import type { InsightContext } from './types';

/** Builders shared by the rule tests. Kept beside the rules they exercise. */
export const TEST_TODAY = '2026-09-04';

const ISO_DATE_LENGTH = 10;
const SESSION_GAP_DAYS = 2;
const DEFAULT_PROTEIN_GRAMS = 100;

export function emptyContext(): InsightContext {
  return {
    today: TEST_TODAY,
    lifts: [],
    weeks: [],
    muscles: [],
    nutrition: [],
    target: null,
    bodyWeightTrend: [],
    trainingDays: new Set(),
  };
}

/** A run of sessions ending today, one every other day. */
export function sessions(values: number[]) {
  const last = new Date(TEST_TODAY).getTime();
  return values.map((value, index) => ({
    at: last - (values.length - 1 - index) * SESSION_GAP_DAYS * MILLISECONDS_PER_DAY,
    value,
  }));
}

/** Consecutive days of eating, ending today. */
export function nutritionDays(kcalPerDay: number[], protein = DEFAULT_PROTEIN_GRAMS) {
  const start = new Date(TEST_TODAY).getTime() - (kcalPerDay.length - 1) * MILLISECONDS_PER_DAY;
  return kcalPerDay.map((kcal, index) => ({
    day: new Date(start + index * MILLISECONDS_PER_DAY).toISOString().slice(0, ISO_DATE_LENGTH),
    kcal,
    protein,
  }));
}
