/** Macronutrients per 100 g, the basis every composition table publishes on. */
export type Nutrients = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
};

/** A named household measure — "1 roti", "1 cup" — and what it weighs. */
export type FoodPortion = {
  label: string;
  grams: number;
  isDefault: boolean;
};

export type FoodSource = 'usda' | 'composed';

export type FoodRecord = {
  id: string;
  name: string;
  source: FoodSource;
  per100g: Nutrients;
  portions: FoodPortion[];
};
