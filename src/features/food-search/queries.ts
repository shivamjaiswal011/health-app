import type { SQLiteDatabase } from 'expo-sqlite';

import type { PerHundredGrams } from '@/domain/nutrition/macros';

const SEARCH_LIMIT = 60;

export type FoodHit = {
  id: string;
  name: string;
  source: 'usda' | 'composed';
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
};

/** The database columns are suffixed; the domain is not. Kept explicit so neither has
 *  to bend to the other's naming. */
export function toPerHundredGrams(hit: FoodHit): PerHundredGrams {
  return {
    kcal: hit.kcalPer100g,
    protein: hit.proteinPer100g,
    carbs: hit.carbsPer100g,
    fat: hit.fatPer100g,
    fiber: hit.fiberPer100g,
  };
}

export type FoodPortionOption = {
  label: string;
  grams: number;
  isDefault: boolean;
};

/**
 * FTS5 matches whole tokens, so each word gets a prefix wildcard to make search feel
 * live as the user types. Anything that is not a letter or digit is dropped: FTS5
 * treats characters like `"` and `*` as syntax and a stray one is a query error, not
 * a no-op.
 */
function toMatchQuery(term: string): string | null {
  const words = term
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
  if (words.length === 0) return null;
  return words.map((word) => `${word}*`).join(' ');
}

const SEARCH_SQL = `
  SELECT f.id, f.name, f.source,
         f.kcal_per_100g    AS kcalPer100g,
         f.protein_per_100g AS proteinPer100g,
         f.carbs_per_100g   AS carbsPer100g,
         f.fat_per_100g     AS fatPer100g,
         f.fiber_per_100g   AS fiberPer100g
  FROM foods_fts
  JOIN foods f ON f.id = foods_fts.food_id
  WHERE foods_fts MATCH ?
  ORDER BY (f.source = 'composed') DESC, length(f.name) ASC
  LIMIT ?
`;

/**
 * Composed Indian dishes rank above USDA entries, and shorter names above longer ones.
 * Someone typing "rice" wants Steamed Rice, not "Rice, white, long-grain, parboiled,
 * enriched, dry" — which BM25 alone would happily put first.
 */
export async function searchFoods(
  foods: SQLiteDatabase,
  term: string,
): Promise<FoodHit[]> {
  const match = toMatchQuery(term);
  if (!match) return [];
  return foods.getAllAsync<FoodHit>(SEARCH_SQL, [match, SEARCH_LIMIT]);
}

export async function loadPortions(
  foods: SQLiteDatabase,
  foodId: string,
): Promise<FoodPortionOption[]> {
  const rows = await foods.getAllAsync<{ label: string; grams: number; is_default: number }>(
    'SELECT label, grams, is_default FROM food_portions WHERE food_id = ? ORDER BY is_default DESC',
    [foodId],
  );
  return rows.map((row) => ({
    label: row.label,
    grams: row.grams,
    isDefault: row.is_default === 1,
  }));
}
