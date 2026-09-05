/**
 * Mifflin-St Jeor resting metabolic rate, the formula with the best track record in
 * validation studies against indirect calorimetry. Every figure it produces is an
 * estimate of a population average; the scale is what actually tells the user whether
 * it was right for them, which is why the weight-versus-intake insight exists.
 */
const MIFFLIN = {
  weightFactor: 10,
  heightFactor: 6.25,
  ageFactor: 5,
  maleOffset: 5,
  femaleOffset: -161,
} as const;

export const BIOLOGICAL_SEXES = ['male', 'female'] as const;
export type BiologicalSex = (typeof BIOLOGICAL_SEXES)[number];

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

/** Standard Harris-Benedict style multipliers applied to resting rate. */
const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOALS = ['lose', 'maintain', 'gain'] as const;
export type Goal = (typeof GOALS)[number];

/**
 * Roughly half a kilo a week either way. Deliberately modest: aggressive deficits cost
 * muscle and adherence, and an app that suggests one is not being helpful.
 */
const GOAL_ADJUSTMENT_KCAL: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

/** Never suggest a target below this, whatever the arithmetic says. */
const FLOOR_KCAL = 1200;

export type Profile = {
  sex: BiologicalSex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
};

export function restingEnergy(profile: Profile): number {
  const base =
    MIFFLIN.weightFactor * profile.weightKg +
    MIFFLIN.heightFactor * profile.heightCm -
    MIFFLIN.ageFactor * profile.ageYears;
  const offset = profile.sex === 'male' ? MIFFLIN.maleOffset : MIFFLIN.femaleOffset;
  return Math.round(base + offset);
}

/** Resting rate scaled for how much the person actually moves. */
export function maintenanceEnergy(profile: Profile): number {
  return Math.round(restingEnergy(profile) * ACTIVITY_MULTIPLIER[profile.activity]);
}

export function targetEnergy(profile: Profile): number {
  const adjusted = maintenanceEnergy(profile) + GOAL_ADJUSTMENT_KCAL[profile.goal];
  return Math.max(FLOOR_KCAL, adjusted);
}
