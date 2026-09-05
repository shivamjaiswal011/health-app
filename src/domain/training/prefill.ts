/** What a set is opened with, before the lifter touches it. */
export type PlannedSet = {
  weightKg: number | null;
  reps: number | null;
};

export type PreviousSet = {
  position: number;
  weightKg: number | null;
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
 * it would put a number in front of the user that no session produced.
 */
export function prefillFromPrevious(targetSets: number, previous: PreviousSet[]): PlannedSet[] {
  const byPosition = new Map(previous.map((set) => [set.position, set]));

  return Array.from({ length: Math.max(0, targetSets) }, (_, position) => {
    const earlier = byPosition.get(position);
    return {
      weightKg: earlier?.weightKg ?? null,
      reps: earlier?.reps ?? null,
    };
  });
}
