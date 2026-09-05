/**
 * The muscle an exercise is trained for. Lives here rather than in the schema because
 * the domain reasons about it — default rep ranges are chosen per muscle — and the
 * database layer may depend on the domain, never the other way round.
 */
export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'full_body',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
