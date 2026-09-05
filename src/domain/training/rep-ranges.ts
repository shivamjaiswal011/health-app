import type { RepRange } from './challenge';
import type { MuscleGroup } from './muscles';

/**
 * Where each muscle's ladder starts by default.
 *
 * Not a claim about fibre type — near-failure sets build muscle across roughly 5 to 30
 * reps, and the endurance argument for high-rep calf work is weaker than it is usually
 * stated. These are practical defaults: a calf raise or a lateral raise is awkward and
 * hard on the joints to load heavily, and a small muscle progresses in increments no
 * plate can match, so reps are the honest lever. Chest and back take the heaviest loads
 * and so ladder lowest.
 *
 * Every one of these is a starting point the lifter can override per exercise.
 */
const RANGE_BY_MUSCLE: Record<MuscleGroup, RepRange> = {
  chest: { low: 6, high: 10 },
  back: { low: 6, high: 10 },
  full_body: { low: 6, high: 10 },
  quads: { low: 8, high: 12 },
  hamstrings: { low: 8, high: 12 },
  glutes: { low: 8, high: 12 },
  biceps: { low: 8, high: 12 },
  triceps: { low: 8, high: 12 },
  shoulders: { low: 10, high: 15 },
  forearms: { low: 12, high: 16 },
  calves: { low: 12, high: 16 },
  core: { low: 12, high: 16 },
};

/** The range this muscle ladders through when nothing more specific is set. */
export function repRangeForMuscle(muscle: MuscleGroup): RepRange {
  return RANGE_BY_MUSCLE[muscle];
}

export type RepRangeSources = {
  /** Set on the routine's exercise. Either end may be missing. */
  pinned: Partial<RepRange>;
  muscle: MuscleGroup;
  /** One range for every lift, when the lifter has chosen that over per-muscle defaults. */
  configured: RepRange | null;
};

/**
 * Which range actually applies, most specific first: what the lifter pinned on this
 * exercise, then their one-range-for-everything choice, then the muscle's default.
 *
 * A half-pinned range takes its missing end from the range below it, so typing only a
 * ceiling is a sensible edit rather than an invalid one. An inverted result falls back
 * whole — a range whose top is under its bottom has no ladder to climb.
 */
export function resolveRepRange(sources: RepRangeSources): RepRange {
  const fallback = sources.configured ?? repRangeForMuscle(sources.muscle);
  const low = sources.pinned.low ?? fallback.low;
  const high = sources.pinned.high ?? fallback.high;
  return high >= low ? { low, high } : fallback;
}
