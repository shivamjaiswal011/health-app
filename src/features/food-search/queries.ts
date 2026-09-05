import type { SQLiteDatabase } from 'expo-sqlite';

import type { PerHundredGrams } from '@/domain/nutrition/macros';

const SEARCH_LIMIT = 60;

/** `custom` foods and `recipe` entries live in the user's own database, the rest in
 *  the bundled one. */
export type FoodHitSource = 'usda' | 'composed' | 'custom' | 'recipe';

export type FoodHit = {
  id: string;
  name: string;
  source: FoodHitSource;
  /** Recipes are logged by the serving, so they carry what one serving weighs. */
  servingGrams?: number;
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

/**
 * Punctuation in USDA names is inconsistent — commas, brackets and hyphens all separate
 * words. Flattening them means "hard-boiled" contains the word "boiled", which is how a
 * user searching for it expects to find the food.
 */
const NORMALISED_NAME =
  "' ' || replace(replace(replace(replace(replace(lower(f.name), ',', ' '), '(', ' '), ')', ' '), '-', ' '), '/', ' ') || ' '";

function buildSearchSql(termCount: number): string {
  const wholeWordHits = Array.from(
    { length: termCount },
    () => `(${NORMALISED_NAME} LIKE ?)`,
  ).join(' + ');

  return `
    SELECT f.id, f.name, f.source,
           f.kcal_per_100g    AS kcalPer100g,
           f.protein_per_100g AS proteinPer100g,
           f.carbs_per_100g   AS carbsPer100g,
           f.fat_per_100g     AS fatPer100g,
           f.fiber_per_100g   AS fiberPer100g
    FROM foods_fts
    JOIN foods f ON f.id = foods_fts.food_id
    WHERE foods_fts MATCH ?
    ORDER BY
      (${wholeWordHits}) DESC,
      (f.source = 'composed') DESC,
      (lower(f.name) LIKE ?) DESC,
      length(f.name) ASC
    LIMIT ?
  `;
}

function termsOf(term: string): string[] {
  return term
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

/**
 * Ranked in four passes: how many search words appear as whole words in the name, then
 * composed Indian dishes, then names opening with the first word, then shortest.
 *
 * Counting whole-word hits across every term is what the first version got wrong twice.
 * Ranking on name length alone put Eggplant and Eggnog above every actual egg, because
 * FTS5 prefix matching treats "egg" and "eggplant" alike. Scoring only the first word
 * then put Eggplant top for "boiled egg", since eggplant is also boiled. The last pass
 * is what makes "rice" find Steamed Rice rather than a rice cracker.
 */
export async function searchFoods(foods: SQLiteDatabase, term: string): Promise<FoodHit[]> {
  const match = toMatchQuery(term);
  if (!match) return [];

  const terms = termsOf(term);
  return foods.getAllAsync<FoodHit>(buildSearchSql(terms.length), [
    match,
    ...terms.map((word) => `% ${word} %`),
    `${terms[0]}%`,
    SEARCH_LIMIT,
  ]);
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
