import { toKilograms, type WeightUnit } from '@/domain/units/weight';

import type { EquipmentType } from './equipment';

/**
 * The smallest jump the equipment can actually be loaded with, per unit.
 *
 * A flat increment is either unloadable on a barbell or brutal on a curl. Equipment is
 * already recorded on every exercise, so the right step is known without asking.
 */
const STEP_BY_EQUIPMENT: Record<EquipmentType, Record<WeightUnit, number>> = {
  barbell: { kg: 2.5, lb: 5 },
  machine: { kg: 2.5, lb: 5 },
  cable: { kg: 2.5, lb: 5 },
  dumbbell: { kg: 1, lb: 2.5 },
  kettlebell: { kg: 1, lb: 2.5 },
  bodyweight: { kg: 1, lb: 2.5 },
  band: { kg: 1, lb: 2.5 },
  other: { kg: 1, lb: 2.5 },
};

/** The suggested step expressed in the unit the lifter is working in. */
export function suggestedStep(equipment: EquipmentType, unit: WeightUnit): number {
  return STEP_BY_EQUIPMENT[equipment][unit];
}

/** The same step in kilograms, for adding to a stored weight. */
export function suggestedStepKilograms(equipment: EquipmentType, unit: WeightUnit): number {
  return toKilograms(suggestedStep(equipment, unit), unit);
}
