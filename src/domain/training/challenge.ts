import type { WeightUnit } from '@/domain/units/weight';

import type { EquipmentType } from './equipment';
import type { PlannedSet } from './prefill';
import { suggestedStepKilograms } from './weight-step';

export type RepRange = { low: number; high: number };

/** A set as it was actually performed, which is all the ladder needs to know. */
export type PerformedWorkingSet = {
  reps: number | null;
  weightKg: number | null;
  weightUnit: WeightUnit;
};

export type ChallengeTarget = {
  targetReps: number;
  /** Carried from last session; null until the lifter has ever loaded this exercise. */
  weightKg: number | null;
  weightUnit: WeightUnit;
  /** Position in the range, for display: "Level 3 of 5". */
  level: number;
  levels: number;
  /** True when last session cleared the top of the range and the weight should rise. */
  rangeConquered: boolean;
};

const FIRST_LEVEL = 1;

function clamp(value: number, range: RepRange): number {
  return Math.min(Math.max(value, range.low), range.high);
}

/**
 * Reps achieved on the weakest working set. Progression is judged on the set that fell
 * short, not the best one — clearing a target means every working set reached it.
 *
 * A set logged without reps counts as zero rather than being skipped: an unfinished set
 * is not evidence the target was met.
 */
function weakestSet(performed: PerformedWorkingSet[]): number {
  return Math.min(...performed.map((set) => set.reps ?? 0));
}

/**
 * What to attempt this session, derived entirely from the last one.
 *
 * Nothing about the ladder is stored. The target is a function of what was logged, so a
 * missed rep re-issues the same target without any attempt counter, and correcting a
 * past set corrects the next target with it.
 *
 * Callers must pass working sets only. A back-off set is lighter and higher-rep by
 * design, and would otherwise clear every target the moment it was performed.
 */
export function nextChallenge(
  range: RepRange,
  performed: PerformedWorkingSet[],
  fallbackUnit: WeightUnit,
): ChallengeTarget {
  const levels = Math.max(FIRST_LEVEL, range.high - range.low + 1);

  if (performed.length === 0) {
    return {
      targetReps: range.low,
      weightKg: null,
      weightUnit: fallbackUnit,
      level: FIRST_LEVEL,
      levels,
      rangeConquered: false,
    };
  }

  const lastWeight = performed[0].weightKg;
  const unit = performed[0].weightUnit;
  const achieved = weakestSet(performed);
  const rangeConquered = achieved >= range.high;
  const targetReps = rangeConquered ? range.low : clamp(achieved + 1, range);

  return {
    targetReps,
    weightKg: lastWeight,
    weightUnit: unit,
    level: targetReps - range.low + FIRST_LEVEL,
    levels,
    rangeConquered,
  };
}

/** How much lighter the back-off set runs, and how many more reps it asks for. */
const BACKOFF_LOAD_FRACTION = 0.8;
const BACKOFF_EXTRA_REPS = 4;

export type BackoffSet = {
  weightKg: number | null;
  weightUnit: WeightUnit;
  reps: number;
};

/**
 * The lighter set appended after the working sets: four more reps at 80% of the load.
 *
 * Volume where it is cheapest — the load is well short of the working weight, so the
 * extra reps are achievable rather than a set the lifter fails and reads as a defeat.
 * A bodyweight exercise carries no load, so it simply asks for the extra reps.
 */
export function backoffSet(target: ChallengeTarget): BackoffSet {
  return {
    weightKg: target.weightKg === null ? null : target.weightKg * BACKOFF_LOAD_FRACTION,
    weightUnit: target.weightUnit,
    reps: target.targetReps + BACKOFF_EXTRA_REPS,
  };
}

export type ChallengePlan = {
  target: ChallengeTarget;
  sets: PlannedSet[];
};

export type ChallengePlanRequest = {
  range: RepRange;
  /** Last session's working sets for this exercise, in order. */
  performed: PerformedWorkingSet[];
  setCount: number;
  equipment: EquipmentType;
  fallbackUnit: WeightUnit;
  includeBackoff: boolean;
};

/**
 * The load to attempt. Conquering the range retires the weight rather than the lifter:
 * the reps reset to the bottom and the bar goes up by the smallest jump the equipment
 * can actually be loaded with.
 */
function challengeLoad(target: ChallengeTarget, equipment: EquipmentType): number | null {
  if (target.weightKg === null || !target.rangeConquered) return target.weightKg;
  return target.weightKg + suggestedStepKilograms(equipment, target.weightUnit);
}

/**
 * This session's opening rows: every working set at the target, then the back-off set.
 *
 * The rows open filled but uncompleted, so the target is a prompt rather than a claim —
 * nothing counts as performed until the lifter ticks it.
 */
export function planChallengeSets(request: ChallengePlanRequest): ChallengePlan {
  const target = nextChallenge(request.range, request.performed, request.fallbackUnit);
  const weightKg = challengeLoad(target, request.equipment);
  const working = { weightKg, weightUnit: target.weightUnit, reps: target.targetReps };

  const sets: PlannedSet[] = Array.from({ length: Math.max(1, request.setCount) }, () => ({
    ...working,
    setType: 'working' as const,
  }));

  if (!request.includeBackoff) return { target, sets };

  const backoff = backoffSet({ ...target, weightKg });
  return { target, sets: [...sets, { ...backoff, setType: 'backoff' as const }] };
}
