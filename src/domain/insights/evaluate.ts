import { underfuelledTrainingDays } from './cross-domain-rules';
import {
  loggingLapsed,
  proteinShortfall,
  weekendDivergence,
  weightVersusIntake,
} from './nutrition-rules';
import {
  decliningVolume,
  neglectedMuscle,
  pushPullImbalance,
  recentProgress,
  stagnantLift,
} from './training-rules';
import type { Insight, InsightContext, InsightRule } from './types';

/**
 * Order matters: this is the order insights appear. Something encouraging comes first
 * where it applies, then the observations most worth acting on.
 */
export const INSIGHT_RULES: InsightRule[] = [
  recentProgress,
  underfuelledTrainingDays,
  proteinShortfall,
  stagnantLift,
  decliningVolume,
  weightVersusIntake,
  weekendDivergence,
  pushPullImbalance,
  neglectedMuscle,
  loggingLapsed,
];

/** Shown at once. Beyond a handful the user stops reading any of them. */
const MAX_SHOWN = 4;

/**
 * Runs every rule and keeps what fired.
 *
 * A rule that throws is skipped rather than taking the dashboard down with it: an
 * insight is a nicety, and no observation is worth a blank screen where the user's
 * training and eating should be.
 */
export function evaluateInsights(
  context: InsightContext,
  rules: InsightRule[] = INSIGHT_RULES,
): Insight[] {
  const found: Insight[] = [];

  for (const rule of rules) {
    try {
      const insight = rule(context);
      if (insight) found.push(insight);
    } catch {
      continue;
    }
    if (found.length === MAX_SHOWN) break;
  }

  return found;
}
