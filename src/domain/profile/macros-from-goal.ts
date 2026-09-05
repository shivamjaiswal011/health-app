import type { Goal, Profile } from './energy';
import { targetEnergy } from './energy';

const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

/**
 * Protein per kilogram of bodyweight. Higher when cutting, where the job is holding on
 * to muscle in a deficit; the evidence clusters around 1.6-2.2 g/kg for people who
 * train, so these sit inside that band rather than at the marketing end of it.
 */
const PROTEIN_PER_KG: Record<Goal, number> = {
  lose: 2.0,
  maintain: 1.8,
  gain: 1.8,
};

/** Fat as a share of total energy. Below roughly 20% starts to cost hormonal health. */
const FAT_SHARE_OF_ENERGY = 0.25;

export type MacroTargets = {
  kcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

/**
 * Turns a profile into a starting point.
 *
 * Protein and fat are set from bodyweight and health floors respectively; carbohydrate
 * takes whatever energy is left. That ordering is deliberate — carbohydrate is the
 * macronutrient with no minimum requirement, so it is the one that should absorb the
 * remainder rather than squeezing the two that do.
 */
export function macrosForProfile(profile: Profile): MacroTargets {
  const kcal = targetEnergy(profile);

  const proteinGrams = Math.round(profile.weightKg * PROTEIN_PER_KG[profile.goal]);
  const fatGrams = Math.round((kcal * FAT_SHARE_OF_ENERGY) / KCAL_PER_GRAM.fat);

  const energyFromProteinAndFat =
    proteinGrams * KCAL_PER_GRAM.protein + fatGrams * KCAL_PER_GRAM.fat;
  const carbsGrams = Math.max(
    0,
    Math.round((kcal - energyFromProteinAndFat) / KCAL_PER_GRAM.carbs),
  );

  return { kcal, proteinGrams, carbsGrams, fatGrams };
}
