import type { WeightUnit } from '@/domain/units/weight';

/**
 * What a set is opened with, before the lifter touches it. `setType` is planned rather
 * than assumed because challenge mode appends a back-off row that must not be counted
 * as working when it becomes next session's history.
 */
export type PlannedSet = {
  weightKg: number | null;
  weightUnit: WeightUnit;
  reps: number | null;
  setType: PlannedSetType;
};

/** The set types a plan can open. Drop and failure sets are added by hand, in the logger. */
export type PlannedSetType = 'working' | 'backoff';

export type PreviousSet = {
  position: number;
  weightKg: number | null;
  weightUnit: WeightUnit;
  reps: number | null;
};

/**
 * Opens each set with what was lifted last time, matched by position.
 *
 * Most sessions repeat the previous one closely, so starting from last week's numbers
 * means editing only what actually changed instead of retyping a whole workout. The
 * values are a starting point, not a record: the set is still untouched until the
 * lifter ticks it off, so nothing is logged that was not actually performed.
 *
 * Positions the previous session did not reach are left blank rather than carrying the
 * last set forward — a fourth set nobody did is not evidence of anything, and guessing
 * it would put a number in front of the user that no session produced. They still adopt
 * the exercise's unit, so a blank row on a pound-marked machine expects pounds.
 */
export function prefillFromPrevious(
  targetSets: number,
  previous: PreviousSet[],
  fallbackUnit: WeightUnit,
): PlannedSet[] {
  const byPosition = new Map(previous.map((set) => [set.position, set]));
  // The unit follows the exercise, not the app setting: a machine marked in pounds is
  // still marked in pounds next week, whatever the lifter prefers elsewhere.
  const exerciseUnit = previous[0]?.weightUnit ?? fallbackUnit;

  return Array.from({ length: Math.max(0, targetSets) }, (_, position) => {
    const earlier = byPosition.get(position);
    return {
      weightKg: earlier?.weightKg ?? null,
      weightUnit: earlier?.weightUnit ?? exerciseUnit,
      reps: earlier?.reps ?? null,
      setType: 'working' as const,
    };
  });
}
