import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { logChange, withTimestamps } from '@/db/mutation';
import { recipeItems, recipes } from '@/db/schema';
import type { LoggedMacros } from '@/domain/nutrition/macros';

const RECIPES = 'recipes';
const RECIPE_ITEMS = 'recipe_items';

export type NewRecipe = {
  id: string;
  name: string;
  servings: number;
};

export async function createRecipe(recipe: NewRecipe): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(recipes).values(withTimestamps(recipe));
    await logChange(tx, { entityTable: RECIPES, entityId: recipe.id, operation: 'insert' });
  });
}

export async function renameRecipe(recipeId: string, name: string): Promise<void> {
  await updateRecipe(recipeId, { name });
}

export async function setServings(recipeId: string, servings: number): Promise<void> {
  await updateRecipe(recipeId, { servings });
}

async function updateRecipe(recipeId: string, changes: Partial<typeof recipes.$inferInsert>) {
  await database.transaction(async (tx) => {
    await tx
      .update(recipes)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(recipes.id, recipeId));
    await logChange(tx, { entityTable: RECIPES, entityId: recipeId, operation: 'update' });
  });
}

export type NewRecipeItem = {
  id: string;
  recipeId: string;
  foodId: string;
  foodSource: 'bundled' | 'custom';
  foodName: string;
  grams: number;
  position: number;
  macros: LoggedMacros;
};

export async function addRecipeItem(item: NewRecipeItem): Promise<void> {
  const { macros, ...rest } = item;
  await database.transaction(async (tx) => {
    await tx.insert(recipeItems).values(
      withTimestamps({
        ...rest,
        kcalAtAdd: macros.kcal,
        proteinAtAdd: macros.protein,
        carbsAtAdd: macros.carbs,
        fatAtAdd: macros.fat,
        fiberAtAdd: macros.fiber,
      }),
    );
    await logChange(tx, { entityTable: RECIPE_ITEMS, entityId: item.id, operation: 'insert' });
  });
}

export async function removeRecipeItem(itemId: string): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(recipeItems)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(recipeItems.id, itemId));
    await logChange(tx, { entityTable: RECIPE_ITEMS, entityId: itemId, operation: 'delete' });
  });
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(recipes)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(recipes.id, recipeId));
    await logChange(tx, { entityTable: RECIPES, entityId: recipeId, operation: 'delete' });
  });
}
