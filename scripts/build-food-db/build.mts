import path from 'node:path';

import { composeDish } from './compose.mts';
import { DISHES, INGREDIENTS } from './dishes.mts';
import type { FoodRecord } from './types.mts';
import { readUsdaRelease } from './usda.mts';
import { writeFoodDatabase } from './write-database.mts';

const OUTPUT = path.join(import.meta.dirname, '../../assets/foods.db');

function usdaReleasePaths(): string[] {
  const directory = process.argv[2];
  if (!directory) throw new Error('Usage: node build.mts <usda-json-directory>');
  return [
    path.join(directory, 'FoodData_Central_foundation_food_json_2026-04-30.json'),
    path.join(directory, 'FoodData_Central_sr_legacy_food_json_2018-04.json'),
  ];
}

/**
 * Foundation Foods is newer and analytically stronger, so where the same food appears
 * in both releases the Foundation record wins. Reading it first and refusing to
 * overwrite is what implements that.
 */
function mergeById(releases: FoodRecord[][]): Map<string, FoodRecord> {
  const merged = new Map<string, FoodRecord>();
  for (const release of releases) {
    for (const record of release) {
      if (!merged.has(record.id)) merged.set(record.id, record);
    }
  }
  return merged;
}

function ingredientsByKey(foods: Map<string, FoodRecord>): Map<string, FoodRecord> {
  const resolved = new Map<string, FoodRecord>();
  for (const [key, usdaId] of Object.entries(INGREDIENTS)) {
    const record = foods.get(usdaId);
    if (!record) throw new Error(`Ingredient "${key}" is missing from USDA (${usdaId})`);
    resolved.set(key, record);
  }
  return resolved;
}

/**
 * Composed in declaration order, with each finished dish added back to the ingredient
 * pool as `dish:<id>`. That is what lets Palak Paneer be built from the paneer defined
 * above it rather than from milk, so the two agree by construction.
 */
function composeAll(ingredients: Map<string, FoodRecord>): FoodRecord[] {
  const composed: FoodRecord[] = [];
  for (const dish of DISHES) {
    const record = composeDish(dish, ingredients);
    ingredients.set(`dish:${dish.id}`, record);
    composed.push(record);
  }
  return composed;
}

function build(): void {
  const releases = usdaReleasePaths().map(readUsdaRelease);
  const usdaFoods = mergeById(releases);
  const ingredients = ingredientsByKey(usdaFoods);
  const dishes = composeAll(ingredients);

  const all = [...usdaFoods.values(), ...dishes];
  writeFoodDatabase(OUTPUT, all);

  console.log(`USDA foods:     ${usdaFoods.size}`);
  console.log(`Composed dishes: ${dishes.length}`);
  console.log(`Written to:     ${OUTPUT}`);
}

build();
