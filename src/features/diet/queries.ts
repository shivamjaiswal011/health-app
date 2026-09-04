import { and, asc, desc, eq, isNull, lte } from 'drizzle-orm';

import { database } from '@/db/client';
import { foodEntries, nutritionTargets } from '@/db/schema';

export function dayEntriesQuery(day: string) {
  return database
    .select({
      id: foodEntries.id,
      mealSlot: foodEntries.mealSlot,
      position: foodEntries.position,
      foodNameAtLog: foodEntries.foodNameAtLog,
      portionLabel: foodEntries.portionLabel,
      portionCount: foodEntries.portionCount,
      gramsAtLog: foodEntries.gramsAtLog,
      kcal: foodEntries.kcalAtLog,
      protein: foodEntries.proteinAtLog,
      carbs: foodEntries.carbsAtLog,
      fat: foodEntries.fatAtLog,
    })
    .from(foodEntries)
    .where(and(eq(foodEntries.loggedOn, day), isNull(foodEntries.deletedAt)))
    .orderBy(asc(foodEntries.mealSlot), asc(foodEntries.position));
}

/**
 * The target in force on a given day, not today's. Effective-dating means past
 * adherence is judged against what the user was actually aiming for at the time.
 */
export function targetForDayQuery(day: string) {
  return database
    .select({
      kcal: nutritionTargets.kcal,
      proteinGrams: nutritionTargets.proteinGrams,
      carbsGrams: nutritionTargets.carbsGrams,
      fatGrams: nutritionTargets.fatGrams,
    })
    .from(nutritionTargets)
    .where(and(lte(nutritionTargets.effectiveFrom, day), isNull(nutritionTargets.deletedAt)))
    .orderBy(desc(nutritionTargets.effectiveFrom))
    .limit(1);
}

/** Foods logged most often, offered as shortcuts before the user types anything. */
export async function loadFrequentFoods(limit: number) {
  return database
    .select({
      foodId: foodEntries.foodId,
      foodSource: foodEntries.foodSource,
      name: foodEntries.foodNameAtLog,
    })
    .from(foodEntries)
    .where(isNull(foodEntries.deletedAt))
    .groupBy(foodEntries.foodId)
    .orderBy(desc(foodEntries.updatedAt))
    .limit(limit);
}
