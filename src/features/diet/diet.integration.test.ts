import { readFileSync } from 'node:fs';
import path from 'node:path';

import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', async () => {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const schema = await import('@/db/schema');
  return { database: drizzle(createClient({ url: ':memory:' }), { schema }) };
});

const { database } = await import('@/db/client');
const { changeLog, foodEntries, nutritionTargets } = await import('@/db/schema');
const { dayEntriesQuery, targetForDayQuery } = await import('./queries');
const { copyDay, logAgain, logFood, removeFoodEntry, setNutritionTarget, updateLoggedPortion } =
  await import('./repository');

const MIGRATIONS_DIR = path.join(__dirname, '../../db/migrations');
const STATEMENT_SEPARATOR = '--> statement-breakpoint';
const TABLES_TO_CLEAR = ['change_log', 'food_entries', 'nutrition_targets'];

const ROTI_MACROS = { kcal: 119.6, protein: 4.6, carbs: 25.2, fat: 0.9, fiber: 3.8 };

async function applyMigrations() {
  const journal = JSON.parse(
    readFileSync(path.join(MIGRATIONS_DIR, 'meta/_journal.json'), 'utf8'),
  ) as { entries: { tag: string }[] };

  for (const entry of journal.entries) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, `${entry.tag}.sql`), 'utf8');
    for (const statement of sql.split(STATEMENT_SEPARATOR)) {
      if (statement.trim()) await database.run(statement);
    }
  }
}

function rotiEntry(id: string, day: string, overrides: Partial<{ position: number }> = {}) {
  return {
    id,
    loggedOn: day,
    mealSlot: 'breakfast' as const,
    position: overrides.position ?? 0,
    foodId: 'composed:roti',
    foodSource: 'bundled' as const,
    foodNameAtLog: 'Roti / Chapati',
    portionLabel: '1 roti',
    portionCount: 1,
    gramsAtLog: 40,
    macros: ROTI_MACROS,
  };
}

beforeAll(async () => {
  await database.run('PRAGMA foreign_keys = ON');
  await applyMigrations();
});

beforeEach(async () => {
  for (const table of TABLES_TO_CLEAR) await database.run(`DELETE FROM ${table}`);
});

describe('logging food', () => {
  it('snapshots the macros as computed at log time', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));

    const [entry] = await dayEntriesQuery('2026-09-04');

    expect(entry).toMatchObject({ kcal: 119.6, protein: 4.6, gramsAtLog: 40 });
  });

  it('keeps a logged entry unchanged when the same food is logged again differently', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));
    await logFood({ ...rotiEntry('e2', '2026-09-04', { position: 1 }), gramsAtLog: 80 });

    const entries = await dayEntriesQuery('2026-09-04');

    expect(entries.map((row) => row.gramsAtLog)).toEqual([40, 80]);
  });

  it('files an entry against its own day only', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));

    expect(await dayEntriesQuery('2026-09-03')).toEqual([]);
    expect(await dayEntriesQuery('2026-09-04')).toHaveLength(1);
  });

  it('writes a change_log row for the insert', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));

    const changes = await database.select().from(changeLog);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ entityTable: 'food_entries', operation: 'insert' });
  });
});

describe('correcting an entry', () => {
  it('updates the portion and its macros together', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));

    await updateLoggedPortion('e1', {
      portionCount: 2,
      gramsAtLog: 80,
      macros: { kcal: 239.2, protein: 9.2, carbs: 50.4, fat: 1.8, fiber: 7.6 },
    });

    const [entry] = await dayEntriesQuery('2026-09-04');
    expect(entry).toMatchObject({ portionCount: 2, gramsAtLog: 80, kcal: 239.2 });
  });

  it('hides a removed entry without erasing the row', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));
    await removeFoodEntry('e1');

    expect(await dayEntriesQuery('2026-09-04')).toEqual([]);
    expect(await database.select().from(foodEntries).where(eq(foodEntries.id, 'e1'))).toHaveLength(
      1,
    );
  });
});

describe('repeating and copying', () => {
  it('logs a recent food again with the same portion and macros', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));
    const [previous] = await dayEntriesQuery('2026-09-04');

    await logAgain(
      {
        foodId: 'composed:roti',
        foodSource: 'bundled',
        foodNameAtLog: previous.foodNameAtLog,
        portionLabel: previous.portionLabel,
        portionCount: previous.portionCount,
        gramsAtLog: previous.gramsAtLog,
        kcal: previous.kcal,
        protein: previous.protein,
        carbs: previous.carbs,
        fat: previous.fat,
        fiber: null,
      },
      { day: '2026-09-05', slot: 'lunch', position: 0 },
    );

    const [repeated] = await dayEntriesQuery('2026-09-05');
    expect(repeated).toMatchObject({ kcal: 119.6, gramsAtLog: 40, mealSlot: 'lunch' });
  });

  it('copies a whole day onto another, meals intact', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));
    await logFood({ ...rotiEntry('e2', '2026-09-04', { position: 1 }), mealSlot: 'dinner' });

    await copyDay('2026-09-04', '2026-09-05');

    const copied = await dayEntriesQuery('2026-09-05');
    expect(copied).toHaveLength(2);
    expect(copied.map((row) => row.mealSlot).sort()).toEqual(['breakfast', 'dinner']);
  });

  it('leaves the source day untouched when copying', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));
    await copyDay('2026-09-04', '2026-09-05');

    expect(await dayEntriesQuery('2026-09-04')).toHaveLength(1);
  });

  it('does not copy an entry that was removed', async () => {
    await logFood(rotiEntry('e1', '2026-09-04'));
    await logFood(rotiEntry('e2', '2026-09-04', { position: 1 }));
    await removeFoodEntry('e2');

    await copyDay('2026-09-04', '2026-09-05');

    expect(await dayEntriesQuery('2026-09-05')).toHaveLength(1);
  });

  it('refuses to copy a day with nothing on it', async () => {
    await expect(copyDay('2026-09-01', '2026-09-05')).rejects.toThrow(/nothing logged/);
  });
});

describe('nutrition targets', () => {
  async function setTarget(effectiveFrom: string, kcal: number) {
    const now = new Date();
    await database.insert(nutritionTargets).values({
      id: `t-${effectiveFrom}`,
      createdAt: now,
      updatedAt: now,
      effectiveFrom,
      kcal,
      proteinGrams: 150,
      carbsGrams: 200,
      fatGrams: 60,
    });
  }

  it('finds no target before any has been set', async () => {
    expect(await targetForDayQuery('2026-09-04')).toEqual([]);
  });

  it('uses the target in force on the day, not the newest one', async () => {
    await setTarget('2026-01-01', 2000);
    await setTarget('2026-09-01', 2500);

    const [older] = await targetForDayQuery('2026-06-15');
    const [newer] = await targetForDayQuery('2026-09-04');

    expect(older.kcal).toBe(2000);
    expect(newer.kcal).toBe(2500);
  });

  it('ignores a target that only takes effect later', async () => {
    await setTarget('2026-09-10', 2500);

    expect(await targetForDayQuery('2026-09-04')).toEqual([]);
  });

  it('retires the previous target when one is set for the same day', async () => {
    await setNutritionTarget({
      id: 't1',
      effectiveFrom: '2026-09-04',
      kcal: 2000,
      proteinGrams: 140,
      carbsGrams: 200,
      fatGrams: 60,
    });
    await setNutritionTarget({
      id: 't2',
      effectiveFrom: '2026-09-04',
      kcal: 2400,
      proteinGrams: 160,
      carbsGrams: 260,
      fatGrams: 70,
    });

    // Exactly one target applies, rather than the answer depending on insertion order.
    const applying = await targetForDayQuery('2026-09-04');
    expect(applying).toHaveLength(1);
    expect(applying[0].kcal).toBe(2400);
  });
});
