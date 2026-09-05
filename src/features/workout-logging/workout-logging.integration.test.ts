import { readFileSync } from 'node:fs';
import path from 'node:path';

import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The repository writes through async transactions, which the better-sqlite3 driver
 * does not support. libsql in-memory speaks the same SQL and does, so the production
 * repository code runs here unmodified.
 */
vi.mock('@/db/client', async () => {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const schema = await import('@/db/schema');
  return { database: drizzle(createClient({ url: ':memory:' }), { schema }) };
});

const { database } = await import('@/db/client');
const { changeLog, exercises, sets, workouts } = await import('@/db/schema');
const { loadPreviousPerformance, workoutSetsQuery } = await import('./queries');
const repository = await import('./repository');

const MIGRATIONS_DIR = path.join(__dirname, '../../db/migrations');
const STATEMENT_SEPARATOR = '--> statement-breakpoint';

const SQUAT = 'catalogue:back-squat-barbell';

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

async function seedSquat() {
  const now = new Date();
  await database.insert(exercises).values({
    id: SQUAT,
    createdAt: now,
    updatedAt: now,
    name: 'Back Squat (Barbell)',
    primaryMuscle: 'quads',
    secondaryMuscles: [],
    equipment: 'barbell',
    trackingMode: 'weight_and_reps',
  });
}

type PerformedSet = { weightKg: number; reps: number; weightUnit?: 'kg' | 'lb'; setType?: 'working' | 'backoff' };

/** Logs a complete session of squats and returns the workout id. */
async function logSquatSession(workoutId: string, performed: PerformedSet[]) {
  const entryId = `${workoutId}-entry`;
  await repository.startWorkout({ id: workoutId, name: 'Session', startedAt: new Date() });
  await repository.addExerciseToWorkout({ id: entryId, workoutId, exerciseId: SQUAT, position: 0 });

  for (const [index, set] of performed.entries()) {
    const setId = `${workoutId}-set-${index}`;
    await repository.addSet({
      id: setId,
      workoutExerciseId: entryId,
      exerciseId: SQUAT,
      position: index,
      setType: set.setType ?? 'working',
      weightUnit: set.weightUnit ?? 'kg',
    });
    await repository.completeSet(setId, { weightKg: set.weightKg, reps: set.reps });
  }
  return workoutId;
}

/** Children first: the truncation runs with foreign keys enforced, as production does. */
const TABLES_TO_CLEAR = ['change_log', 'sets', 'workout_exercises', 'workouts', 'exercises'];

beforeAll(async () => {
  await database.run('PRAGMA foreign_keys = ON');
  await applyMigrations();
});

beforeEach(async () => {
  for (const table of TABLES_TO_CLEAR) {
    await database.run(`DELETE FROM ${table}`);
  }
  await seedSquat();
});

describe('logging a session', () => {
  it('persists each set as it is completed', async () => {
    await logSquatSession('w1', [
      { weightKg: 100, reps: 5 },
      { weightKg: 100, reps: 5 },
    ]);

    const logged = await workoutSetsQuery('w1');

    expect(logged).toHaveLength(2);
    expect(logged.every((set) => set.completedAt !== null)).toBe(true);
  });

  it('keeps an added set recoverable before any value is entered', async () => {
    await repository.startWorkout({ id: 'w1', name: 'S', startedAt: new Date() });
    await repository.addExerciseToWorkout({
      id: 'e1',
      workoutId: 'w1',
      exerciseId: SQUAT,
      position: 0,
    });
    await repository.addSet({
      id: 's1',
      workoutExerciseId: 'e1',
      exerciseId: SQUAT,
      position: 0,
      setType: 'working',
    });

    const [recovered] = await workoutSetsQuery('w1');

    expect(recovered).toMatchObject({ id: 's1', weightKg: null, completedAt: null });
  });

  it('writes a change_log row for every mutation', async () => {
    await logSquatSession('w1', [{ weightKg: 100, reps: 5 }]);

    const changes = await database.select().from(changeLog);

    // workout + workout_exercise + set insert, then the set completion update
    expect(changes).toHaveLength(4);
    expect(changes.filter((change) => change.operation === 'insert')).toHaveLength(3);
    expect(changes.filter((change) => change.operation === 'update')).toHaveLength(1);
  });

  it('hides a removed set from the session without erasing the row', async () => {
    await logSquatSession('w1', [
      { weightKg: 100, reps: 5 },
      { weightKg: 100, reps: 5 },
    ]);
    await repository.removeSet('w1-set-0');

    expect(await workoutSetsQuery('w1')).toHaveLength(1);
    expect(await database.select().from(sets).where(eq(sets.id, 'w1-set-0'))).toHaveLength(1);
  });
});

describe('starting a planned workout', () => {
  it('leaves no partial session behind when the plan cannot be written', async () => {
    const blank = { weightKg: null, weightUnit: 'kg' as const, reps: null, setType: 'working' as const };
    const plan = [
      { exerciseId: SQUAT, sets: [blank, blank] },
      { exerciseId: 'catalogue:does-not-exist', sets: [blank, blank] },
    ];

    await expect(
      repository.startPlannedWorkout({ id: 'w1', name: 'Push', startedAt: new Date() }, plan),
    ).rejects.toThrow();

    // The workout row inserts before the failing exercise, so this only holds if the
    // whole thing is one transaction.
    expect(await database.select().from(workouts).where(eq(workouts.id, 'w1'))).toEqual([]);
    expect(await workoutSetsQuery('w1')).toEqual([]);
  });
});

describe('previous performance', () => {
  it('is empty the first time an exercise is trained', async () => {
    await logSquatSession('w1', [{ weightKg: 100, reps: 5 }]);
    expect(await loadPreviousPerformance(SQUAT, 'w1')).toEqual([]);
  });

  it('returns the last session, not the one in progress', async () => {
    await logSquatSession('w1', [
      { weightKg: 100, reps: 5 },
      { weightKg: 105, reps: 5 },
    ]);
    await repository.finishWorkout('w1');
    await logSquatSession('w2', [{ weightKg: 110, reps: 3 }]);

    const previous = await loadPreviousPerformance(SQUAT, 'w2');

    expect(previous).toEqual([
      { position: 0, weightKg: 100, weightUnit: 'kg', reps: 5 },
      { position: 1, weightKg: 105, weightUnit: 'kg', reps: 5 },
    ]);
  });

  it('reaches back only to the most recent session, not all history', async () => {
    await logSquatSession('w1', [{ weightKg: 80, reps: 8 }]);
    await repository.finishWorkout('w1');
    await logSquatSession('w2', [{ weightKg: 90, reps: 6 }]);
    await repository.finishWorkout('w2');

    const previous = await loadPreviousPerformance(SQUAT, 'w3');

    expect(previous).toEqual([{ position: 0, weightKg: 90, weightUnit: 'kg', reps: 6 }]);
  });

  it('ignores sets that were never completed', async () => {
    await repository.startWorkout({ id: 'w1', name: 'S', startedAt: new Date() });
    await repository.addExerciseToWorkout({
      id: 'e1',
      workoutId: 'w1',
      exerciseId: SQUAT,
      position: 0,
    });
    await repository.addSet({
      id: 's1',
      workoutExerciseId: 'e1',
      exerciseId: SQUAT,
      position: 0,
      setType: 'working',
    });
    await repository.finishWorkout('w1');

    expect(await loadPreviousPerformance(SQUAT, 'w2')).toEqual([]);
  });

  it('ignores an exercise removed from an otherwise kept session', async () => {
    await logSquatSession('w1', [{ weightKg: 100, reps: 5 }]);
    await repository.finishWorkout('w1');
    await logSquatSession('w2', [{ weightKg: 200, reps: 1 }]);
    await repository.finishWorkout('w2');
    await repository.removeWorkoutExercise('w2-entry');

    const previous = await loadPreviousPerformance(SQUAT, 'w3');

    expect(previous).toEqual([{ position: 0, weightKg: 100, weightUnit: 'kg', reps: 5 }]);
  });

  it('reports each set in the unit it was entered in', async () => {
    await logSquatSession('w1', [
      { weightKg: 100, reps: 5 },
      { weightKg: 61.235, reps: 5, weightUnit: 'lb' },
    ]);
    await repository.finishWorkout('w1');

    const previous = await loadPreviousPerformance(SQUAT, 'w2');

    expect(previous.map((set) => set.weightUnit)).toEqual(['kg', 'lb']);
  });

  it('excludes a back-off set, which is lighter and higher-rep than the work', async () => {
    await logSquatSession('w1', [
      { weightKg: 100, reps: 8 },
      { weightKg: 80, reps: 12, setType: 'backoff' },
    ]);
    await repository.finishWorkout('w1');

    // Letting the back-off row through would ghost 80 kg behind the second working set
    // and hand challenge mode twelve reps the lifter never did at the working weight.
    const previous = await loadPreviousPerformance(SQUAT, 'w2');

    expect(previous).toEqual([{ position: 0, weightKg: 100, weightUnit: 'kg', reps: 8 }]);
  });

  it('ignores a discarded session', async () => {
    await logSquatSession('w1', [{ weightKg: 100, reps: 5 }]);
    await repository.finishWorkout('w1');
    await logSquatSession('w2', [{ weightKg: 200, reps: 1 }]);
    await repository.discardWorkout('w2');

    const previous = await loadPreviousPerformance(SQUAT, 'w3');

    expect(previous).toEqual([{ position: 0, weightKg: 100, weightUnit: 'kg', reps: 5 }]);
  });
});
