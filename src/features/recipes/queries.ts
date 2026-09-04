import { and, asc, eq, isNull, sum } from 'drizzle-orm';

import { database } from '@/db/client';
import { recipeItems, recipes } from '@/db/schema';

export function recipeListQuery() {
  return database
    .select({ id: recipes.id, name: recipes.name, servings: recipes.servings })
    .from(recipes)
    .where(isNull(recipes.deletedAt))
    .orderBy(asc(recipes.name));
}

export function recipeQuery(recipeId: string) {
  return database
    .select({ id: recipes.id, name: recipes.name, servings: recipes.servings })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), isNull(recipes.deletedAt)))
    .limit(1);
}

/**
 * Recipes with their ingredient totals, for listing and for search. Totals come from
 * the snapshots on each ingredient, so this is a plain aggregate rather than a
 * cross-database lookup.
 */
export function recipeSummariesQuery() {
  return database
    .select({
      id: recipes.id,
      name: recipes.name,
      servings: recipes.servings,
      totalGrams: sum(recipeItems.grams).mapWith(Number),
      totalKcal: sum(recipeItems.kcalAtAdd).mapWith(Number),
      totalProtein: sum(recipeItems.proteinAtAdd).mapWith(Number),
      totalCarbs: sum(recipeItems.carbsAtAdd).mapWith(Number),
      totalFat: sum(recipeItems.fatAtAdd).mapWith(Number),
    })
    .from(recipes)
    .leftJoin(
      recipeItems,
      and(eq(recipeItems.recipeId, recipes.id), isNull(recipeItems.deletedAt)),
    )
    .where(isNull(recipes.deletedAt))
    .groupBy(recipes.id)
    .orderBy(asc(recipes.name));
}

export type RecipeItemRow = {
  id: string;
  foodName: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
};

export function recipeItemsQuery(recipeId: string) {
  return database
    .select({
      id: recipeItems.id,
      foodName: recipeItems.foodName,
      grams: recipeItems.grams,
      kcal: recipeItems.kcalAtAdd,
      protein: recipeItems.proteinAtAdd,
      carbs: recipeItems.carbsAtAdd,
      fat: recipeItems.fatAtAdd,
      fiber: recipeItems.fiberAtAdd,
    })
    .from(recipeItems)
    .where(and(eq(recipeItems.recipeId, recipeId), isNull(recipeItems.deletedAt)))
    .orderBy(asc(recipeItems.position));
}
