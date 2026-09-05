import { createMMKV } from 'react-native-mmkv';

import { WEIGHT_UNITS, type WeightUnit } from '@/domain/units/weight';
import { reportFailure } from '@/ui/failure';

const DISPLAY_KEY = 'units.display';
const BODYWEIGHT_KEY = 'units.bodyweight';
const DEFAULT_UNIT: WeightUnit = 'kg';

/** Shared with the onboarding flag: a per-device display choice, not user data. */
const storage = createMMKV({ id: 'preferences' });

function read(key: string): WeightUnit {
  try {
    const stored = storage.getString(key);
    return WEIGHT_UNITS.includes(stored as WeightUnit) ? (stored as WeightUnit) : DEFAULT_UNIT;
  } catch (cause) {
    // A device that cannot read preferences should still show weights.
    reportFailure('Reading unit preference', cause);
    return DEFAULT_UNIT;
  }
}

/** The unit for totals, charts, records and insight text. */
export function displayUnit(): WeightUnit {
  return read(DISPLAY_KEY);
}

export function setDisplayUnit(unit: WeightUnit): void {
  storage.set(DISPLAY_KEY, unit);
}

/** A scale reads in one unit and never changes, so this is set rather than per entry. */
export function bodyweightUnit(): WeightUnit {
  return storage.getString(BODYWEIGHT_KEY) ? read(BODYWEIGHT_KEY) : displayUnit();
}

export function setBodyweightUnit(unit: WeightUnit): void {
  storage.set(BODYWEIGHT_KEY, unit);
}
