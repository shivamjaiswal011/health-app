import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

import type { FoodRecord } from './types.mts';

const SCHEMA = `
CREATE TABLE foods (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  source            TEXT NOT NULL,
  kcal_per_100g     REAL NOT NULL,
  protein_per_100g  REAL NOT NULL,
  carbs_per_100g    REAL NOT NULL,
  fat_per_100g      REAL NOT NULL,
  fiber_per_100g    REAL
);

CREATE TABLE food_portions (
  id          INTEGER PRIMARY KEY,
  food_id     TEXT NOT NULL REFERENCES foods(id),
  label       TEXT NOT NULL,
  grams       REAL NOT NULL,
  is_default  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_food_portions_food ON food_portions(food_id);

-- Standalone rather than external-content: the table is small, and keeping it
-- independent means search cannot be desynchronised from foods by a partial write.
CREATE VIRTUAL TABLE foods_fts USING fts5(
  food_id UNINDEXED,
  name,
  tokenize = 'unicode61'
);
`;

function insertFoods(connection: Database.Database, foods: FoodRecord[]): void {
  const food = connection.prepare(
    `INSERT INTO foods (id, name, source, kcal_per_100g, protein_per_100g,
                        carbs_per_100g, fat_per_100g, fiber_per_100g)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const portion = connection.prepare(
    'INSERT INTO food_portions (food_id, label, grams, is_default) VALUES (?, ?, ?, ?)',
  );
  const searchable = connection.prepare('INSERT INTO foods_fts (food_id, name) VALUES (?, ?)');

  for (const record of foods) {
    const { per100g } = record;
    food.run(
      record.id,
      record.name,
      record.source,
      per100g.kcal,
      per100g.protein,
      per100g.carbs,
      per100g.fat,
      per100g.fiber,
    );
    searchable.run(record.id, record.name);
    for (const measure of record.portions) {
      portion.run(record.id, measure.label, measure.grams, measure.isDefault ? 1 : 0);
    }
  }
}

/** Writes the bundled read-only database, replacing any previous build. */
export function writeFoodDatabase(outputPath: string, foods: FoodRecord[]): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  rmSync(outputPath, { force: true });

  const connection = new Database(outputPath);
  connection.pragma('journal_mode = DELETE');
  connection.exec(SCHEMA);
  connection.transaction(() => insertFoods(connection, foods))();
  connection.exec('VACUUM');
  connection.close();
}
