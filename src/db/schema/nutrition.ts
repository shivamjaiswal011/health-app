import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { WEIGHT_UNITS } from '@/domain/units/weight';

import { syncColumns } from './shared';

/**
 * Nutrients are stored per 100g throughout, matching how composition tables
 * (IFCT, USDA) publish them. Household portions convert to grams at log time.
 */
const nutrientColumns = {
  kcalPer100g: real('kcal_per_100g').notNull(),
  proteinPer100g: real('protein_per_100g').notNull(),
  carbsPer100g: real('carbs_per_100g').notNull(),
  fatPer100g: real('fat_per_100g').notNull(),
  fiberPer100g: real('fiber_per_100g'),
};

export const FOOD_SOURCES = ['bundled', 'custom', 'recipe'] as const;
export type FoodSource = (typeof FOOD_SOURCES)[number];

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const customFoods = sqliteTable(
  'custom_foods',
  {
    ...syncColumns,
    name: text('name').notNull(),
    brand: text('brand'),
    ...nutrientColumns,
  },
  (table) => [index('idx_custom_foods_name').on(table.name)],
);

/**
 * Named household measures ("1 roti", "1 katori dal") mapped to grams.
 * Without these the app is unusable in practice — nobody weighs a chapati.
 */
export const customFoodPortions = sqliteTable(
  'custom_food_portions',
  {
    ...syncColumns,
    customFoodId: text('custom_food_id')
      .notNull()
      .references(() => customFoods.id),
    label: text('label').notNull(),
    grams: real('grams').notNull(),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [index('idx_custom_food_portions_food').on(table.customFoodId)],
);

export const recipes = sqliteTable('recipes', {
  ...syncColumns,
  name: text('name').notNull(),
  servings: real('servings').notNull().default(1),
  notes: text('notes'),
});

export const recipeItems = sqliteTable(
  'recipe_items',
  {
    ...syncColumns,
    recipeId: text('recipe_id')
      .notNull()
      .references(() => recipes.id),
    /** Points into the bundled foods.db or custom_foods; recipes cannot nest. */
    foodId: text('food_id').notNull(),
    foodSource: text('food_source', { enum: ['bundled', 'custom'] }).notNull(),
    foodName: text('food_name').notNull(),
    grams: real('grams').notNull(),
    position: integer('position').notNull(),
    /**
     * The ingredient's contribution, snapshotted when it was added. Ingredients span
     * two databases — bundled foods and the user's own — so totals cannot be summed in
     * SQL from a reference alone. Storing them also means editing a custom food later
     * cannot silently restate a recipe the user already trusts.
     */
    kcalAtAdd: real('kcal_at_add').notNull().default(0),
    proteinAtAdd: real('protein_at_add').notNull().default(0),
    carbsAtAdd: real('carbs_at_add').notNull().default(0),
    fatAtAdd: real('fat_at_add').notNull().default(0),
    fiberAtAdd: real('fiber_at_add'),
  },
  (table) => [index('idx_recipe_items_recipe').on(table.recipeId, table.position)],
);

/**
 * A logged food. Macros are snapshotted at log time rather than resolved through
 * `foodId` on read: correcting a food definition later must not silently rewrite
 * a user's history.
 *
 * `loggedOn` is a local calendar date (YYYY-MM-DD), not an instant — a meal belongs
 * to the day the user considers it, regardless of timezone travel.
 */
export const foodEntries = sqliteTable(
  'food_entries',
  {
    ...syncColumns,
    loggedOn: text('logged_on').notNull(),
    mealSlot: text('meal_slot', { enum: MEAL_SLOTS }).notNull(),
    position: integer('position').notNull().default(0),
    foodId: text('food_id').notNull(),
    foodSource: text('food_source', { enum: FOOD_SOURCES }).notNull(),
    foodNameAtLog: text('food_name_at_log').notNull(),
    portionLabel: text('portion_label'),
    portionCount: real('portion_count').notNull().default(1),
    gramsAtLog: real('grams_at_log').notNull(),
    kcalAtLog: real('kcal_at_log').notNull(),
    proteinAtLog: real('protein_at_log').notNull(),
    carbsAtLog: real('carbs_at_log').notNull(),
    fatAtLog: real('fat_at_log').notNull(),
    fiberAtLog: real('fiber_at_log'),
  },
  (table) => [
    index('idx_food_entries_day').on(table.loggedOn, table.mealSlot, table.position),
    index('idx_food_entries_food').on(table.foodId),
  ],
);

/**
 * Effective-dated so past adherence is judged against the target that was actually
 * set at the time, not today's.
 */
export const nutritionTargets = sqliteTable(
  'nutrition_targets',
  {
    ...syncColumns,
    effectiveFrom: text('effective_from').notNull(),
    kcal: real('kcal').notNull(),
    proteinGrams: real('protein_grams').notNull(),
    carbsGrams: real('carbs_grams').notNull(),
    fatGrams: real('fat_grams').notNull(),
  },
  (table) => [index('idx_nutrition_targets_effective_from').on(table.effectiveFrom)],
);

export const bodyMetrics = sqliteTable(
  'body_metrics',
  {
    ...syncColumns,
    measuredOn: text('measured_on').notNull(),
    weightKg: real('weight_kg'),
    weightUnit: text('weight_unit', { enum: WEIGHT_UNITS }).notNull().default('kg'),
    bodyFatPercent: real('body_fat_percent'),
    notes: text('notes'),
  },
  (table) => [index('idx_body_metrics_measured_on').on(table.measuredOn)],
);

export type CustomFood = typeof customFoods.$inferSelect;
export type CustomFoodPortion = typeof customFoodPortions.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeItem = typeof recipeItems.$inferSelect;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type NutritionTarget = typeof nutritionTargets.$inferSelect;
export type BodyMetric = typeof bodyMetrics.$inferSelect;
