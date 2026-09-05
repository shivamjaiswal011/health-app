export const WEIGHT_UNITS = ['kg', 'lb'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

const POUNDS_PER_KILOGRAM = 2.20462262;
const DISPLAY_DECIMALS = 1;
const ROUNDING_STEPS = 10;

/**
 * Weight is stored in kilograms, always. A unit is a fact about how a value was entered,
 * not about what it means — so converting for display must never write back, and a gym
 * that marks its leg press in pounds cannot alter what the database holds.
 */
export function toDisplayWeight(kilograms: number, unit: WeightUnit): number {
  const converted = unit === 'lb' ? kilograms * POUNDS_PER_KILOGRAM : kilograms;
  return Math.round(converted * ROUNDING_STEPS) / ROUNDING_STEPS;
}

/**
 * Full precision on the way in. Rounding here instead would make 45 lb read back as
 * 44.9 lb after a round trip, and a lifter who sees that stops trusting the log.
 */
export function toKilograms(entered: number, unit: WeightUnit): number {
  return unit === 'lb' ? entered / POUNDS_PER_KILOGRAM : entered;
}

/** Drops a trailing zero, because "60 kg" reads better than "60.0 kg". */
export function formatWeight(kilograms: number, unit: WeightUnit): string {
  const shown = toDisplayWeight(kilograms, unit);
  const digits = Number.isInteger(shown) ? 0 : DISPLAY_DECIMALS;
  return `${shown.toFixed(digits)} ${unit}`;
}

/**
 * Whole kilograms or pounds with thousands separators, for tonnage — the decimal on a
 * 32,000 kg week is noise, and the separator is what makes the number readable at all.
 */
export function formatWeightTotal(kilograms: number, unit: WeightUnit): string {
  return `${Math.round(toDisplayWeight(kilograms, unit)).toLocaleString()} ${unit}`;
}

/** Signed, so a change reads as a direction rather than a number to compare by eye. */
export function formatWeightChange(kilograms: number, unit: WeightUnit): string {
  return `${kilograms >= 0 ? '+' : '-'}${formatWeight(Math.abs(kilograms), unit)}`;
}
