import { and, asc, desc, eq, isNull, lte, max } from 'drizzle-orm';

import { database } from '@/db/client';
import { foodEntries, nutritionTargets, type FoodSource } from '@/db/schema';

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

export type RecentFood = {
  foodId: string;
  foodSource: FoodSource;
  foodNameAtLog: string;
  portionLabel: string | null;
  portionCount: number;
  gramsAtLog: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
};

/**
 * Distinct foods the user logged most recently, carrying the whole snapshot from the
 * last time. That is what lets a repeat be logged in one tap without going back to the
 * food database at all — most eating is repetitive, and re-typing yesterday's breakfast
 * is the friction that kills diet tracking.
 */
export function recentFoodsQuery(limit: number) {
  return database
    .select({
      foodId: foodEntries.foodId,
      foodSource: foodEntries.foodSource,
      foodNameAtLog: foodEntries.foodNameAtLog,
      portionLabel: foodEntries.portionLabel,
      portionCount: foodEntries.portionCount,
      gramsAtLog: foodEntries.gramsAtLog,
      kcal: foodEntries.kcalAtLog,
      protein: foodEntries.proteinAtLog,
      carbs: foodEntries.carbsAtLog,
      fat: foodEntries.fatAtLog,
      fiber: foodEntries.fiberAtLog,
      lastLoggedAt: max(foodEntries.updatedAt),
    })
    .from(foodEntries)
    .where(isNull(foodEntries.deletedAt))
    .groupBy(foodEntries.foodId)
    .orderBy(desc(max(foodEntries.updatedAt)))
    .limit(limit);
}
