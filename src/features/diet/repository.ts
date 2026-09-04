import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { logChange, withTimestamps } from '@/db/mutation';
import { foodEntries, type FoodSource, type MealSlot } from '@/db/schema';
import type { LoggedMacros } from '@/domain/nutrition/macros';

const FOOD_ENTRIES = 'food_entries';

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

export type PortionChange = {
  portionCount: number;
  gramsAtLog: number;
  macros: LoggedMacros;
};

/** Corrects how much was eaten, leaving which food it was alone. */
export async function updateLoggedPortion(
  entryId: string,
  change: PortionChange,
): Promise<void> {
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
