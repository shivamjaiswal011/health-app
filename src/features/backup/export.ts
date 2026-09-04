import { database } from '@/db/client';
import * as schema from '@/db/schema';

import { BACKUP_FORMAT_VERSION, type Backup } from './format';

/** Every user-owned table. The bundled food database is not included — it ships with
 *  the app and re-downloading a copy of it in every backup would be waste. */
const EXPORTED_TABLES = {
  exercises: schema.exercises,
  routines: schema.routines,
  routineExercises: schema.routineExercises,
  workouts: schema.workouts,
  workoutExercises: schema.workoutExercises,
  sets: schema.sets,
  personalRecords: schema.personalRecords,
  customFoods: schema.customFoods,
  customFoodPortions: schema.customFoodPortions,
  recipes: schema.recipes,
  recipeItems: schema.recipeItems,
  foodEntries: schema.foodEntries,
  nutritionTargets: schema.nutritionTargets,
  bodyMetrics: schema.bodyMetrics,
} as const;

export type BackupTable = keyof typeof EXPORTED_TABLES;

/**
 * Reads every user table into one document.
 *
 * Soft-deleted rows are included deliberately. They are tombstones, and dropping them
 * would make a restore look like a resurrection of things the user deleted.
 */
export async function buildBackup(): Promise<Backup> {
  const tables: Record<string, unknown[]> = {};

  for (const [name, table] of Object.entries(EXPORTED_TABLES)) {
    tables[name] = await database.select().from(table);
  }

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export function countRows(backup: Backup): number {
  return Object.values(backup.tables).reduce((running, rows) => running + rows.length, 0);
}
