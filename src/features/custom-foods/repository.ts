import { and, asc, eq, isNull, like } from 'drizzle-orm';

import { database } from '@/db/client';
import { newId } from '@/db/id';
import { logChange, withTimestamps } from '@/db/mutation';
import { customFoodPortions, customFoods } from '@/db/schema';
import type { PerHundredGrams } from '@/domain/nutrition/macros';

const CUSTOM_FOODS = 'custom_foods';
const SEARCH_LIMIT = 20;

export type NewCustomFood = {
  id: string;
  name: string;
  brand: string | null;
  per100g: PerHundredGrams;
  /** Optional household measure, so the food is loggable the way it is eaten. */
  portion: { label: string; grams: number } | null;
};

/**
 * Creates a user's own food and its portion together. One transaction because a food
 * saved without the measure the user described it in is only half useful, and they
 * would have no way to tell the write had partly failed.
 */
export async function createCustomFood(food: NewCustomFood): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(customFoods).values(
      withTimestamps({
        id: food.id,
        name: food.name,
        brand: food.brand,
        kcalPer100g: food.per100g.kcal,
        proteinPer100g: food.per100g.protein,
        carbsPer100g: food.per100g.carbs,
        fatPer100g: food.per100g.fat,
        fiberPer100g: food.per100g.fiber,
      }),
    );
    await logChange(tx, { entityTable: CUSTOM_FOODS, entityId: food.id, operation: 'insert' });

    if (!food.portion) return;
    await tx.insert(customFoodPortions).values(
      withTimestamps({
        id: newId(),
        customFoodId: food.id,
        label: food.portion.label,
        grams: food.portion.grams,
        isDefault: true,
      }),
    );
  });
}

export async function deleteCustomFood(foodId: string): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(customFoods)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(customFoods.id, foodId));
    await logChange(tx, { entityTable: CUSTOM_FOODS, entityId: foodId, operation: 'delete' });
  });
}

/** The user's own foods matching a term, ranked above the bundled database in search. */
export function customFoodSearchQuery(term: string) {
  const trimmed = term.trim();
  return database
    .select({
      id: customFoods.id,
      name: customFoods.name,
      brand: customFoods.brand,
      kcalPer100g: customFoods.kcalPer100g,
      proteinPer100g: customFoods.proteinPer100g,
      carbsPer100g: customFoods.carbsPer100g,
      fatPer100g: customFoods.fatPer100g,
      fiberPer100g: customFoods.fiberPer100g,
    })
    .from(customFoods)
    .where(
      and(
        isNull(customFoods.deletedAt),
        trimmed.length > 0 ? like(customFoods.name, `%${trimmed}%`) : undefined,
      ),
    )
    .orderBy(asc(customFoods.name))
    .limit(SEARCH_LIMIT);
}

export function customFoodPortionsQuery(foodId: string) {
  return database
    .select({ label: customFoodPortions.label, grams: customFoodPortions.grams })
    .from(customFoodPortions)
    .where(
      and(eq(customFoodPortions.customFoodId, foodId), isNull(customFoodPortions.deletedAt)),
    );
}
