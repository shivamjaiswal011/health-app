const EPLEY_REP_DIVISOR = 30;

/**
 * Past roughly a dozen reps the Epley estimate drifts high enough to be misleading,
 * and a set that long is testing endurance rather than strength. Refusing to guess
 * is more honest than plotting a number nobody should train from.
 */
const HIGHEST_MEANINGFUL_REPS = 12;

/**
 * Estimated one-rep max by the Epley formula, in kilograms.
 *
 * Returns null when no meaningful estimate exists — a bodyweight set with no load,
 * an unfinished set, or a rep count beyond the formula's useful range. Callers must
 * treat null as "no data point", never as zero.
 */
export function estimateOneRepMax(weightKg: number | null, reps: number | null): number | null {
  if (weightKg === null || reps === null) return null;
  if (weightKg <= 0 || reps <= 0) return null;
  if (reps > HIGHEST_MEANINGFUL_REPS) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / EPLEY_REP_DIVISOR);
}
