import { readFileSync } from 'node:fs';
import path from 'node:path';

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', async () => {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const schema = await import('@/db/schema');
  return { database: drizzle(createClient({ url: ':memory:' }), { schema }) };
});

const { database } = await import('@/db/client');
const { bodyMetrics, changeLog } = await import('@/db/schema');
const { recordBodyWeight } = await import('./repository');
const { bodyWeightQuery } = await import('./queries');

const MIGRATIONS_DIR = path.join(__dirname, '../../db/migrations');
const STATEMENT_SEPARATOR = '--> statement-breakpoint';
const TODAY = '2026-09-05';

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

beforeAll(async () => {
  await database.run('PRAGMA foreign_keys = ON');
  await applyMigrations();
});

beforeEach(async () => {
  await database.run('DELETE FROM change_log');
  await database.run('DELETE FROM body_metrics');
});

describe('recording a weigh-in', () => {
  it('keeps the reading in the unit it was entered in', async () => {
    await recordBodyWeight({ id: 'w1', measuredOn: TODAY, weightKg: 61.2, weightUnit: 'lb' });

    const [stored] = await database.select().from(bodyMetrics);

    expect(stored).toMatchObject({ weightKg: 61.2, weightUnit: 'lb' });
  });

  it('replaces an earlier reading for the same day rather than adding to it', async () => {
    await recordBodyWeight({ id: 'w1', measuredOn: TODAY, weightKg: 82, weightUnit: 'kg' });
    await recordBodyWeight({ id: 'w2', measuredOn: TODAY, weightKg: 67, weightUnit: 'kg' });

    // Two readings on one day would put a fifteen-kilo swing in the trend that never
    // happened to the user's bodyweight.
    expect(await bodyWeightQuery()).toEqual([{ measuredOn: TODAY, weightKg: 67 }]);
  });

  it('logs a tombstone for the reading it replaced, not only the new one', async () => {
    await recordBodyWeight({ id: 'w1', measuredOn: TODAY, weightKg: 82, weightUnit: 'kg' });
    await recordBodyWeight({ id: 'w2', measuredOn: TODAY, weightKg: 67, weightUnit: 'kg' });

    const changes = await database.select().from(changeLog);
    const deletes = changes.filter((change) => change.operation === 'delete');

    // Without this a synced device would keep showing a reading this one retired.
    expect(deletes.map((change) => change.entityId)).toEqual(['w1']);
  });

  it('leaves a different day alone', async () => {
    await recordBodyWeight({ id: 'w1', measuredOn: '2026-09-04', weightKg: 82, weightUnit: 'kg' });
    await recordBodyWeight({ id: 'w2', measuredOn: TODAY, weightKg: 67, weightUnit: 'kg' });

    expect(await bodyWeightQuery()).toHaveLength(2);
  });
});
