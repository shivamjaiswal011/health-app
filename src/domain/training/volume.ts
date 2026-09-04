import type { CompletedSet } from './types';

/**
 * Load moved by a single set, in kilograms. Bodyweight sets carry no external load
 * and contribute nothing to tonnage — they still count as a set, which is what
 * `countWorkingSets` is for.
 */
export function setVolume(weightKg: number | null, reps: number | null): number {
  if (weightKg === null || reps === null) return 0;
  if (weightKg <= 0 || reps <= 0) return 0;
  return weightKg * reps;
}

/** Total tonnage across a group of sets. */
export function totalVolume(sets: CompletedSet[]): number {
  return sets.reduce((running, set) => running + setVolume(set.weightKg, set.reps), 0);
}

/**
 * Sets are the unit most programmes prescribe in, so weekly set count is tracked
 * alongside tonnage — they diverge sharply when a lifter changes rep ranges.
 */
export function countSetsPerExercise(sets: CompletedSet[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const set of sets) {
    counts.set(set.exerciseId, (counts.get(set.exerciseId) ?? 0) + 1);
  }
  return counts;
}
