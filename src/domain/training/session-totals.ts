import type { CompletedSet } from './types';
import { totalVolume } from './volume';

const MILLISECONDS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

export type SessionTotals = {
  setCount: number;
  tonnageKg: number;
};

/** What a finished session amounted to: how much was done, and how much was moved. */
export function summariseSets(sets: CompletedSet[]): SessionTotals {
  return { setCount: sets.length, tonnageKg: totalVolume(sets) };
}

/**
 * How long the session ran. Null while it is still open — a workout left running
 * overnight would otherwise report fourteen hours of training.
 */
export function sessionMinutes(startedAt: Date, endedAt: Date | null): number | null {
  if (endedAt === null) return null;
  const elapsed = endedAt.getTime() - startedAt.getTime();
  return elapsed > 0 ? Math.round(elapsed / MILLISECONDS_PER_MINUTE) : 0;
}

/** Reads as a duration rather than a number: "1h 12m", not "72". */
export function formatSessionLength(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < MINUTES_PER_HOUR) return `${minutes}m`;
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const remainder = minutes % MINUTES_PER_HOUR;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}
