import { createMMKV } from 'react-native-mmkv';

import type { RepRange } from '@/domain/training/challenge';
import { reportFailure } from '@/ui/failure';

const ENABLED_KEY = 'challenge.enabled';
const BACKOFF_KEY = 'challenge.backoff';
const RANGE_LOW_KEY = 'challenge.range.low';
const RANGE_HIGH_KEY = 'challenge.range.high';

/** Eight to twelve: enough reps to progress through, few enough to finish a range. */
export const DEFAULT_REP_RANGE: RepRange = { low: 8, high: 12 };

const storage = createMMKV({ id: 'preferences' });

/**
 * How the lifter has challenge mode configured. Read together rather than one key at a
 * time, because a session planned from a half-read configuration would silently target
 * the wrong reps.
 */
export type ChallengeSettings = {
  backoffSets: boolean;
  defaultRange: RepRange;
};

function readFlag(key: string, fallback: boolean): boolean {
  try {
    return storage.getBoolean(key) ?? fallback;
  } catch (cause) {
    reportFailure('Reading challenge settings', cause);
    return fallback;
  }
}

/** Opt-in: a lifter who has not asked for targets should not be handed any. */
export function challengeEnabled(): boolean {
  return readFlag(ENABLED_KEY, false);
}

export function setChallengeEnabled(enabled: boolean): void {
  storage.set(ENABLED_KEY, enabled);
}

function readRange(): RepRange {
  const low = storage.getNumber(RANGE_LOW_KEY) ?? DEFAULT_REP_RANGE.low;
  const high = storage.getNumber(RANGE_HIGH_KEY) ?? DEFAULT_REP_RANGE.high;
  return high >= low ? { low, high } : DEFAULT_REP_RANGE;
}

export function challengeSettings(): ChallengeSettings {
  return { backoffSets: readFlag(BACKOFF_KEY, true), defaultRange: readRange() };
}

export function setBackoffSets(enabled: boolean): void {
  storage.set(BACKOFF_KEY, enabled);
}

export function setDefaultRepRange(range: RepRange): void {
  storage.set(RANGE_LOW_KEY, range.low);
  storage.set(RANGE_HIGH_KEY, range.high);
}
