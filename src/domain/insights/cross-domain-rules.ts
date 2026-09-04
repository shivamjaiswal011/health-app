import type { DayNutrition, InsightRule } from './types';

const MINIMUM_DAYS_EACH_SIDE = 3;
const UNDEREATING_RATIO = 0.9;

function averageKcal(days: DayNutrition[]): number {
  if (days.length === 0) return 0;
  return days.reduce((running, day) => running + day.kcal, 0) / days.length;
}

/**
 * Eating less on the days you train than on the days you do not.
 *
 * This is the insight that justifies one app rather than two: neither the training log
 * nor the food log can see it alone. It is also common — training days are busy days,
 * and busy days are the ones people forget to eat on.
 */
export const underfuelledTrainingDays: InsightRule = (context) => {
  const logged = context.nutrition.filter((day) => day.kcal > 0);
  const trained = logged.filter((day) => context.trainingDays.has(day.day));
  const rested = logged.filter((day) => !context.trainingDays.has(day.day));

  if (trained.length < MINIMUM_DAYS_EACH_SIDE || rested.length < MINIMUM_DAYS_EACH_SIDE) {
    return null;
  }

  const onTrainingDays = averageKcal(trained);
  const onRestDays = averageKcal(rested);
  if (onTrainingDays >= onRestDays * UNDEREATING_RATIO) return null;

  const difference = onRestDays - onTrainingDays;
  return {
    id: 'underfuelled-training-days',
    title: 'You eat less on training days',
    evidence: `${Math.round(onTrainingDays)} kcal on days you train against ${Math.round(onRestDays)} on days you rest — ${Math.round(difference)} kcal fewer when the demand is highest.`,
    tone: 'attention',
  };
};
