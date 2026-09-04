import { readFileSync } from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import journal from './migrations/meta/_journal.json';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const STATEMENT_SEPARATOR = '--> statement-breakpoint';

function applyAllMigrations(connection: Database.Database): void {
  for (const entry of journal.entries) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, `${entry.tag}.sql`), 'utf8');
    for (const statement of sql.split(STATEMENT_SEPARATOR)) {
      if (statement.trim()) connection.exec(statement);
    }
  }
}

function listTableNames(connection: Database.Database): string[] {
  const rows = connection
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all() as { name: string }[];
  return rows.map((row) => row.name);
}

describe('migrations', () => {
  it('apply cleanly to an empty database', () => {
    const connection = new Database(':memory:');
    expect(() => applyAllMigrations(connection)).not.toThrow();
  });

  it('create every table the app reads from', () => {
    const connection = new Database(':memory:');
    applyAllMigrations(connection);

    expect(listTableNames(connection)).toEqual(
      expect.arrayContaining([
        'body_metrics',
        'change_log',
        'custom_foods',
        'exercises',
        'food_entries',
        'nutrition_targets',
        'personal_records',
        'recipes',
        'routines',
        'sets',
        'workout_exercises',
        'workouts',
      ]),
    );
  });

  it('enforce foreign keys once the pragma is on', () => {
    const connection = new Database(':memory:');
    applyAllMigrations(connection);
    connection.pragma('foreign_keys = ON');

    const insertOrphanSet = connection.prepare(
      `INSERT INTO sets (id, created_at, updated_at, workout_exercise_id, exercise_id, position, set_type)
       VALUES ('s1', 0, 0, 'missing-parent', 'missing-exercise', 0, 'working')`,
    );

    expect(() => insertOrphanSet.run()).toThrow(/FOREIGN KEY/i);
  });
});
