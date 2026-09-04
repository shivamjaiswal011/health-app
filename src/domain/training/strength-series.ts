import type { SeriesPoint } from '@/domain/progress/time-series';

import { estimateOneRepMax } from './one-rep-max';

export type PerformedSetRecord = {
  completedAt: Date | null;
  weightKg: number | null;
  reps: number | null;
};

const START_OF_DAY = 0;

function startOfDay(moment: Date): number {
  const day = new Date(moment);
  day.setHours(START_OF_DAY, START_OF_DAY, START_OF_DAY, START_OF_DAY);
  return day.getTime();
}

/**
 * Best estimated one-rep max on each day the exercise was trained.
 *
 * One point per session rather than per set: a session's warm-ups would otherwise drag
 * the line down and make a strong day look like a weak one. Days where no set yields an
 * estimate — all bodyweight, or every set beyond the formula's range — are absent
 * rather than plotted as zero, which would read as a catastrophic loss of strength.
 */
export function bestOneRepMaxByDay(sets: PerformedSetRecord[]): SeriesPoint[] {
  const bestByDay = new Map<number, number>();

  for (const set of sets) {
    if (!set.completedAt) continue;
    const estimate = estimateOneRepMax(set.weightKg, set.reps);
    if (estimate === null) continue;

    const day = startOfDay(set.completedAt);
    const previousBest = bestByDay.get(day);
    if (previousBest === undefined || estimate > previousBest) bestByDay.set(day, estimate);
  }

  return [...bestByDay.entries()]
    .map(([at, value]) => ({ at, value }))
    .sort((left, right) => left.at - right.at);
}
