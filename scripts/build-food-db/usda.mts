import { readFileSync } from 'node:fs';

import type { FoodPortion, FoodRecord, Nutrients } from './types.mts';

/** USDA nutrient numbers. Stable across releases; the internal ids are not. */
const NUTRIENT_NUMBERS = {
  energyKcal: '208',
  energyAtwaterGeneral: '957',
  protein: '203',
  fat: '204',
  carbs: '205',
  fiber: '291',
} as const;

const GRAMS_PER_100G = 100;

type RawNutrient = {
  nutrient?: { number?: string };
  amount?: number;
  median?: number;
};

type RawPortion = {
  gramWeight?: number;
  amount?: number;
  modifier?: string;
  portionDescription?: string;
  measureUnit?: { name?: string };
};

type RawFood = {
  fdcId: number;
  description?: string;
  foodNutrients?: RawNutrient[];
  foodPortions?: RawPortion[];
};

function nutrientAmount(food: RawFood, number: string): number | null {
  const match = food.foodNutrients?.find((entry) => entry.nutrient?.number === number);
  if (!match) return null;
  const amount = match.amount ?? match.median;
  return typeof amount === 'number' ? amount : null;
}

function readNutrients(food: RawFood): Nutrients | null {
  const kcal =
    nutrientAmount(food, NUTRIENT_NUMBERS.energyKcal) ??
    nutrientAmount(food, NUTRIENT_NUMBERS.energyAtwaterGeneral);
  const protein = nutrientAmount(food, NUTRIENT_NUMBERS.protein);
  const carbs = nutrientAmount(food, NUTRIENT_NUMBERS.carbs);
  const fat = nutrientAmount(food, NUTRIENT_NUMBERS.fat);

  // A food missing any macro cannot be logged meaningfully, so it is dropped rather
  // than shipped with zeroes that would quietly understate someone's intake.
  if (kcal === null || protein === null || carbs === null || fat === null) return null;

  return { kcal, protein, carbs, fat, fiber: nutrientAmount(food, NUTRIENT_NUMBERS.fiber) };
}

function portionLabel(portion: RawPortion): string | null {
  const described = portion.portionDescription?.trim();
  if (described && described !== 'Quantity not specified') return described;

  const unit = portion.measureUnit?.name;
  const modifier = portion.modifier?.trim();
  const measure = unit && unit !== 'undetermined' ? unit : modifier;
  if (!measure) return null;

  const amount = portion.amount ?? 1;
  return `${amount} ${measure}`.trim();
}

function readPortions(food: RawFood): FoodPortion[] {
  const portions: FoodPortion[] = [];
  for (const raw of food.foodPortions ?? []) {
    const label = portionLabel(raw);
    if (!label || !raw.gramWeight) continue;
    portions.push({ label, grams: raw.gramWeight, isDefault: portions.length === 0 });
  }
  return portions;
}

/** Every USDA release nests its foods under a single top-level key naming the dataset. */
function foodsFromRelease(parsed: Record<string, unknown>): RawFood[] {
  const [collection] = Object.values(parsed);
  if (!Array.isArray(collection)) throw new Error('Unexpected USDA release shape');
  return collection as RawFood[];
}

export function readUsdaRelease(path: string): FoodRecord[] {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const records: FoodRecord[] = [];

  for (const food of foodsFromRelease(parsed)) {
    // Releases carry the occasional null entry.
    if (!food) continue;
    const per100g = readNutrients(food);
    if (!per100g || !food.description) continue;
    records.push({
      id: `usda:${food.fdcId}`,
      name: food.description,
      source: 'usda',
      per100g,
      portions: readPortions(food),
    });
  }
  return records;
}

export { GRAMS_PER_100G };
