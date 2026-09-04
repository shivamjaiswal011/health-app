const STEPS_PER_UNIT = 10;

/**
 * One decimal place. Food composition is an estimate to begin with, and more digits
 * imply a precision that is not there — nobody weighed their dal to the milligram.
 */
export function toOneDecimal(value: number): number {
  return Math.round(value * STEPS_PER_UNIT) / STEPS_PER_UNIT;
}
