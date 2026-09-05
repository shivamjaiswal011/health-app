import { createMMKV } from 'react-native-mmkv';

import type { RepRange } from '@/domain/training/challenge';
import { reportFailure } from '@/ui/failure';

const ENABLED_KEY = 'challenge.enabled';
const BACKOFF_KEY = 'challenge.backoff';
const RANGE_LOW_KEY = 'challenge.range.low';
const RANGE_HIGH_KEY = 'challenge.range.high';

const storage = createMMKV({ id: 'preferences' });

/**
 * How the lifter has challenge mode configured. Read together rather than one key at a
 * time, because a session planned from a half-read configuration would silently target
 * the wrong reps.
 */
export type ChallengeSettings = {
  backoffSets: boolean;
  /**
   * One range for every lift, or null to ladder each muscle through its own default.
   * Null is the default: a calf raise and a bench press do not belong on the same
   * ladder, and making the lifter set that per exercise is work they should not need.
   */
  defaultRange: RepRange | null;
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

function readRange(): RepRange | null {
  const low = storage.getNumber(RANGE_LOW_KEY);
  const high = storage.getNumber(RANGE_HIGH_KEY);
  if (low === undefined || high === undefined || high < low) return null;
  return { low, high };
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

/** Hands every exercise back to its muscle's own default. */
export function clearDefaultRepRange(): void {
  storage.remove(RANGE_LOW_KEY);
  storage.remove(RANGE_HIGH_KEY);
}
