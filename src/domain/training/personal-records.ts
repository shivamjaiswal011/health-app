import { estimateOneRepMax } from './one-rep-max';
import type { CompletedSet } from './types';

/**
 * The domain owns this vocabulary; the database column merely stores it. Keeping the
 * definition here is what lets the schema and the insight rules agree on one spelling.
 */
export const PERSONAL_RECORD_KINDS = [
  'heaviest_weight',
  'best_estimated_1rm',
  'best_session_volume',
] as const;
export type PersonalRecordKind = (typeof PERSONAL_RECORD_KINDS)[number];

export type PersonalBests = {
  heaviestWeightKg: number | null;
  bestEstimatedOneRepMax: number | null;
  bestSessionVolume: number | null;
};

export type BeatenRecord = {
  kind: PersonalRecordKind;
  value: number;
};

/** A record only counts as beaten when there is a previous mark or none at all. */
function beats(candidate: number | null, existing: number | null): candidate is number {
  if (candidate === null) return false;
  return existing === null || candidate > existing;
}

/**
 * Records broken by a single completed set. Returns an empty array rather than null
 * so callers can iterate without a guard — no record is the common case.
 */
export function findRecordsBeatenBySet(previous: PersonalBests, set: CompletedSet): BeatenRecord[] {
  const beaten: BeatenRecord[] = [];
  const { weightKg, reps } = set;

  const carriedLoad = weightKg !== null && weightKg > 0;
  if (carriedLoad && reps !== null && reps > 0 && beats(weightKg, previous.heaviestWeightKg)) {
    beaten.push({ kind: 'heaviest_weight', value: weightKg });
  }

  const estimated = estimateOneRepMax(weightKg, reps);
  if (beats(estimated, previous.bestEstimatedOneRepMax)) {
    beaten.push({ kind: 'best_estimated_1rm', value: estimated });
  }

  return beaten;
}

/** Session-volume records need the whole session, so they are judged separately. */
export function findSessionVolumeRecord(
  previous: PersonalBests,
  sessionVolume: number,
): BeatenRecord | null {
  if (sessionVolume <= 0) return null;
  if (!beats(sessionVolume, previous.bestSessionVolume)) return null;
  return { kind: 'best_session_volume', value: sessionVolume };
}
