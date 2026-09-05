import { and, eq, isNull } from 'drizzle-orm';

import { database } from '@/db/client';
import { newId } from '@/db/id';
import { logChange, withTimestamps } from '@/db/mutation';
import { foodEntries, nutritionTargets, type FoodSource, type MealSlot } from '@/db/schema';
import type { LoggedMacros } from '@/domain/nutrition/macros';

const FOOD_ENTRIES = 'food_entries';
const NUTRITION_TARGETS = 'nutrition_targets';

export type NewFoodEntry = {
  id: string;
  loggedOn: string;
  mealSlot: MealSlot;
  position: number;
  foodId: string;
  foodSource: FoodSource;
  foodNameAtLog: string;
  portionLabel: string | null;
  portionCount: number;
  gramsAtLog: number;
  macros: LoggedMacros;
};

function toRow(entry: NewFoodEntry) {
  const { macros, ...rest } = entry;
  return withTimestamps({
    ...rest,
    kcalAtLog: macros.kcal,
    proteinAtLog: macros.protein,
    carbsAtLog: macros.carbs,
    fatAtLog: macros.fat,
    fiberAtLog: macros.fiber,
  });
}

/**
 * Records a food against a day and meal. Macros are written as they were computed at
 * this moment rather than resolved through `foodId` on read: correcting a food
 * definition later must never silently rewrite what someone already ate.
 */
export async function logFood(entry: NewFoodEntry): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(foodEntries).values(toRow(entry));
    await logChange(tx, { entityTable: FOOD_ENTRIES, entityId: entry.id, operation: 'insert' });
  });
}

export type NewNutritionTarget = {
  id: string;
  effectiveFrom: string;
  kcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

/**
 * Sets the target taking effect from a given day. Any target already effective from
 * that same day is retired first, so a day has exactly one target and history stays
 * unambiguous rather than depending on insertion order.
 */
export async function setNutritionTarget(target: NewNutritionTarget): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(nutritionTargets)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          eq(nutritionTargets.effectiveFrom, target.effectiveFrom),
          isNull(nutritionTargets.deletedAt),
        ),
      );
    await tx.insert(nutritionTargets).values(withTimestamps(target));
    await logChange(tx, {
      entityTable: NUTRITION_TARGETS,
      entityId: target.id,
      operation: 'insert',
    });
  });
}

export async function removeFoodEntry(entryId: string): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(foodEntries)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(foodEntries.id, entryId));
    await logChange(tx, { entityTable: FOOD_ENTRIES, entityId: entryId, operation: 'delete' });
  });
}

export type RepeatableEntry = {
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

function repeatAs(entry: RepeatableEntry, placement: EntryPlacement): NewFoodEntry {
  return {
    id: newId(),
    loggedOn: placement.day,
    mealSlot: placement.slot,
    position: placement.position,
    foodId: entry.foodId,
    foodSource: entry.foodSource,
    foodNameAtLog: entry.foodNameAtLog,
    portionLabel: entry.portionLabel,
    portionCount: entry.portionCount,
    gramsAtLog: entry.gramsAtLog,
    macros: {
      kcal: entry.kcal,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber,
    },
  };
}

export type EntryPlacement = {
  day: string;
  slot: MealSlot;
  position: number;
};

/**
 * Logs a food again exactly as it was logged before. Works from the previous entry's
 * own snapshot, so it needs no lookup in the food database and cannot disagree with
 * what the user saw last time.
 */
export async function logAgain(entry: RepeatableEntry, placement: EntryPlacement): Promise<void> {
  await logFood(repeatAs(entry, placement));
}

/**
 * Duplicates a whole day's eating onto another day, meals and portions intact.
 * Written as one transaction: half a copied day is worse than none, because the user
 * would have to work out which half is missing.
 */
export async function copyDay(from: string, to: string): Promise<void> {
  const source = await database
    .select()
    .from(foodEntries)
    .where(and(eq(foodEntries.loggedOn, from), isNull(foodEntries.deletedAt)));

  if (source.length === 0) throw new Error('That day has nothing logged to copy');

  await database.transaction(async (tx) => {
    for (const original of source) {
      const copy = withTimestamps({
        ...original,
        id: newId(),
        loggedOn: to,
        deletedAt: null,
      });
      await tx.insert(foodEntries).values(copy);
      await logChange(tx, {
        entityTable: FOOD_ENTRIES,
        entityId: copy.id,
        operation: 'insert',
      });
    }
  });
}

export type PortionChange = {
  portionCount: number;
  gramsAtLog: number;
  macros: LoggedMacros;
};

/** Corrects how much was eaten, leaving which food it was alone. */
export async function updateLoggedPortion(entryId: string, change: PortionChange): Promise<void> {
  await database.transaction(async (tx) => {
    await tx
      .update(foodEntries)
      .set({
        portionCount: change.portionCount,
        gramsAtLog: change.gramsAtLog,
        kcalAtLog: change.macros.kcal,
        proteinAtLog: change.macros.protein,
        carbsAtLog: change.macros.carbs,
        fatAtLog: change.macros.fat,
        fiberAtLog: change.macros.fiber,
        updatedAt: new Date(),
      })
      .where(eq(foodEntries.id, entryId));
    await logChange(tx, { entityTable: FOOD_ENTRIES, entityId: entryId, operation: 'update' });
  });
}
