import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { customFoodSearchQuery } from '@/features/custom-foods/repository';
import { recipeSummariesQuery } from '@/features/recipes/queries';
import { reportFailure } from '@/ui/failure';

import { searchFoods, type FoodHit } from './queries';

const GRAMS_PER_100G = 100;

type RecipeSummary = {
  id: string;
  name: string;
  servings: number;
  totalGrams: number | null;
  totalKcal: number | null;
  totalProtein: number | null;
  totalCarbs: number | null;
  totalFat: number | null;
};

/**
 * A recipe presented as a food. Expressing it per 100 g lets the portion picker treat
 * it like anything else, while the serving weight it carries becomes its one portion.
 * Recipes with no ingredients are left out — there is nothing to log.
 */
function asFoodHit(recipe: RecipeSummary): FoodHit | null {
  const grams = recipe.totalGrams ?? 0;
  if (grams <= 0) return null;
  const per100 = GRAMS_PER_100G / grams;

  return {
    id: recipe.id,
    name: recipe.name,
    source: 'recipe',
    servingGrams: grams / Math.max(1, recipe.servings),
    kcalPer100g: (recipe.totalKcal ?? 0) * per100,
    proteinPer100g: (recipe.totalProtein ?? 0) * per100,
    carbsPer100g: (recipe.totalCarbs ?? 0) * per100,
    fatPer100g: (recipe.totalFat ?? 0) * per100,
    fiberPer100g: null,
  };
}

function matching(term: string) {
  const needle = term.trim().toLowerCase();
  return (hit: FoodHit) => hit.name.toLowerCase().includes(needle);
}

/**
 * The user's own recipes and foods alongside the bundled database. Both rank above it:
 * they exist precisely because what shipped did not cover them.
 */
export function useCombinedFoodSearch(term: string): FoodHit[] {
  const bundledSource = useSQLiteContext();
  const [bundled, setBundled] = useState<FoodHit[]>([]);
  const custom = useLiveQuery(customFoodSearchQuery(term), [term]);
  const recipes = useLiveQuery(recipeSummariesQuery());

  useEffect(() => {
    let abandoned = false;
    searchFoods(bundledSource, term)
      .then((found) => {
        if (!abandoned) setBundled(found);
      })
      .catch((cause) => reportFailure('Searching foods', cause));
    return () => {
      abandoned = true;
    };
  }, [bundledSource, term]);

  const recipeHits = recipes.data
    .map(asFoodHit)
    .filter((hit): hit is FoodHit => hit !== null)
    .filter(matching(term));

  return [
    ...recipeHits,
    ...custom.data.map((row) => ({ ...row, source: 'custom' as const })),
    ...bundled,
  ];
}
