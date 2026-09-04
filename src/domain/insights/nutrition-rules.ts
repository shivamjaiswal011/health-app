import { describeChange } from '@/domain/progress/time-series';

import type { DayNutrition, InsightRule } from './types';

const RECENT_DAYS = 7;
const ADHERENCE_WINDOW_DAYS = 14;
const ADHERENCE_EXPECTED_DAYS = 10;
const PROTEIN_SHORTFALL_RATIO = 0.85;
const WEEKEND_EXCESS_RATIO = 1.15;
const SATURDAY = 6;
const SUNDAY = 0;
/** Fewer than this on either side and the comparison is anecdote, not pattern. */
const MINIMUM_DAYS_EACH_SIDE = 2;
const ALLOWED_UNLOGGED_DAYS = 2;

function averageOf(days: DayNutrition[], pick: (day: DayNutrition) => number): number {
  if (days.length === 0) return 0;
  return days.reduce((running, day) => running + pick(day), 0) / days.length;
}

function lastDays(nutrition: DayNutrition[], count: number): DayNutrition[] {
  return nutrition.slice(-count);
}

/**
 * Protein consistently under target. Reported as an average rather than per day
 * because one low day is a Tuesday, and a week of them is a pattern.
 */
export const proteinShortfall: InsightRule = (context) => {
  if (!context.target) return null;
  const recent = lastDays(context.nutrition, RECENT_DAYS);
  if (recent.length < RECENT_DAYS) return null;

  const average = averageOf(recent, (day) => day.protein);
  if (average >= context.target.proteinGrams * PROTEIN_SHORTFALL_RATIO) return null;

  const shortfall = context.target.proteinGrams - average;
  return {
    id: 'protein-shortfall',
    title: 'Protein is running below target',
    evidence: `${Math.round(average)}g a day over the last week against a ${Math.round(context.target.proteinGrams)}g target — short by about ${Math.round(shortfall)}g daily.`,
    tone: 'attention',
  };
};

/** Logging that has quietly lapsed. Every other nutrition rule depends on this one. */
export const loggingLapsed: InsightRule = (context) => {
  const window = lastDays(context.nutrition, ADHERENCE_WINDOW_DAYS);
  const logged = window.filter((day) => day.kcal > 0).length;
  if (window.length === 0) return null;
  if (logged >= ADHERENCE_EXPECTED_DAYS) return null;

  return {
    id: 'logging-lapsed',
    title: 'Food logging has gaps',
    evidence: `${logged} of the last ${ADHERENCE_WINDOW_DAYS} days have food logged. Averages below this line are only as good as what went in.`,
    tone: 'neutral',
  };
};

function isWeekend(day: string): boolean {
  const weekday = new Date(day).getUTCDay();
  return weekday === SATURDAY || weekday === SUNDAY;
}

/** Weekends undoing the week — the most common reason a careful deficit stalls. */
export const weekendDivergence: InsightRule = (context) => {
  const logged = context.nutrition.filter((day) => day.kcal > 0);
  const weekend = logged.filter((day) => isWeekend(day.day));
  const weekday = logged.filter((day) => !isWeekend(day.day));
  if (weekend.length < MINIMUM_DAYS_EACH_SIDE || weekday.length < MINIMUM_DAYS_EACH_SIDE) {
    return null;
  }

  const weekendAverage = averageOf(weekend, (day) => day.kcal);
  const weekdayAverage = averageOf(weekday, (day) => day.kcal);
  if (weekendAverage < weekdayAverage * WEEKEND_EXCESS_RATIO) return null;

  const difference = weekendAverage - weekdayAverage;
  return {
    id: 'weekend-divergence',
    title: 'Weekends run higher than weekdays',
    evidence: `${Math.round(weekendAverage)} kcal on weekend days against ${Math.round(weekdayAverage)} on weekdays — about ${Math.round(difference)} kcal more, twice a week.`,
    tone: 'neutral',
  };
};

const GAINING = 'gaining';
const LOSING = 'losing';
const WEIGHT_CHANGE_THRESHOLD_KG = 0.5;
/** Below this share of target, "within target" would be a mis-description. */
const WELL_UNDER_TARGET_RATIO = 0.7;

function describeIntake(eaten: number, targetKcal: number): string {
  if (eaten < targetKcal * WELL_UNDER_TARGET_RATIO) return ', well under your target';
  if (eaten <= targetKcal) return ', within your target';
  return ', above your target';
}

/**
 * Reconciles the scale against what was logged. This is the one insight that can tell
 * a user their intake estimate is wrong rather than their effort — the scale is the
 * measurement, the logging is the estimate, and when they disagree the scale wins.
 */
export const weightVersusIntake: InsightRule = (context) => {
  if (!context.target) return null;
  const change = describeChange(context.bodyWeightTrend);
  if (!change || Math.abs(change.delta) < WEIGHT_CHANGE_THRESHOLD_KG) return null;

  const recent = lastDays(context.nutrition, RECENT_DAYS).filter((day) => day.kcal > 0);
  if (recent.length < RECENT_DAYS - ALLOWED_UNLOGGED_DAYS) return null;

  const eaten = averageOf(recent, (day) => day.kcal);
  const direction = change.delta > 0 ? GAINING : LOSING;
  const intake = describeIntake(eaten, context.target.kcal);

  return {
    id: 'weight-versus-intake',
    title: `You are ${direction} on ${Math.round(eaten)} kcal a day`,
    evidence: `Trend weight moved ${change.delta > 0 ? '+' : ''}${change.delta.toFixed(1)} kg while you logged ${Math.round(eaten)} kcal daily${intake}. The scale is the measurement; the logging is the estimate.`,
    tone: 'neutral',
  };
};
