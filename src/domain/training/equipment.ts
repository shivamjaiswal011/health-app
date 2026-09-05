/**
 * What a lift is loaded with. Lives here rather than in the schema because the domain
 * reasons about it — the smallest usable weight jump differs per equipment — and the
 * database layer may depend on the domain, never the other way round.
 */
export const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
  'other',
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];
