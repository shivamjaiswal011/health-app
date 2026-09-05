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
const { exercises, routineExercises, workouts } = await import('@/db/schema');
const { loadPreviousPerformance, workoutExercisesQuery, workoutSetsQuery } =
  await import('@/features/workout-logging/queries');
const { routineExercisesQuery, routineListQuery } = await import('./queries');
const { startWorkoutFromRoutine } = await import('./start-from-routine');
const { saveWorkoutAsRoutine } = await import('./save-as-routine');
const repository = await import('./repository');
const workoutRepository = await import('@/features/workout-logging/repository');

const MIGRATIONS_DIR = path.join(__dirname, '../../db/migrations');
const STATEMENT_SEPARATOR = '--> statement-breakpoint';
const TABLES_TO_CLEAR = [
  'change_log',
  'sets',
  'workout_exercises',
  'workouts',
  'routine_exercises',
  'routines',
  'exercises',
];

const SQUAT = 'catalogue:squat';
const BENCH = 'catalogue:bench';

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

async function seedExercise(id: string, name: string) {
  const now = new Date();
  await database.insert(exercises).values({
    id,
    createdAt: now,
    updatedAt: now,
    name,
    primaryMuscle: 'quads',
    secondaryMuscles: [],
    equipment: 'barbell',
    trackingMode: 'weight_and_reps',
  });
}

async function buildRoutine(routineId: string, plan: [string, number][]) {
  await repository.createRoutine({ id: routineId, name: 'Push A', position: 0 });
  for (const [index, [exerciseId, targetSets]] of plan.entries()) {
    await repository.addExerciseToRoutine({
      id: `${routineId}-${index}`,
      routineId,
      exerciseId,
      position: index,
      targetSets,
    });
  }
}

beforeAll(async () => {
  await database.run('PRAGMA foreign_keys = ON');
  await applyMigrations();
});

beforeEach(async () => {
  for (const table of TABLES_TO_CLEAR) {
    await database.run(`DELETE FROM ${table}`);
  }
  await seedExercise(SQUAT, 'Back Squat');
  await seedExercise(BENCH, 'Bench Press');
});

describe('editing a routine', () => {
  it('lists exercises in the order they were added', async () => {
    await buildRoutine('r1', [
      [SQUAT, 3],
      [BENCH, 4],
    ]);

    const entries = await routineExercisesQuery('r1');

    expect(entries.map((entry) => entry.name)).toEqual(['Back Squat', 'Bench Press']);
  });

  it('applies a reorder to the stored positions', async () => {
    await buildRoutine('r1', [
      [SQUAT, 3],
      [BENCH, 4],
    ]);
    await repository.reorderRoutineExercises(['r1-1', 'r1-0']);

    const entries = await routineExercisesQuery('r1');

    expect(entries.map((entry) => entry.name)).toEqual(['Bench Press', 'Back Squat']);
  });

  it('hides a removed exercise but keeps the row', async () => {
    await buildRoutine('r1', [
      [SQUAT, 3],
      [BENCH, 4],
    ]);
    await repository.removeRoutineExercise('r1-0');

    expect(await routineExercisesQuery('r1')).toHaveLength(1);
  });

  it('hides a deleted routine from the list', async () => {
    await buildRoutine('r1', [[SQUAT, 3]]);
    await repository.deleteRoutine('r1');

    expect(await routineListQuery()).toEqual([]);
  });
});

describe('saving a performed workout as a routine', () => {
  async function logAdHocSession(workoutId: string, plan: [string, number][]) {
    await workoutRepository.startWorkout({ id: workoutId, name: 'Ad hoc', startedAt: new Date() });
    for (const [index, [exerciseId, setCount]] of plan.entries()) {
      const entryId = `${workoutId}-e${index}`;
      await workoutRepository.addExerciseToWorkout({
        id: entryId,
        workoutId,
        exerciseId,
        position: index,
      });
      for (let slot = 0; slot < setCount; slot += 1) {
        await workoutRepository.addSet({
          id: `${entryId}-s${slot}`,
          workoutExerciseId: entryId,
          exerciseId,
          position: slot,
          setType: 'working',
        });
      }
    }
  }

  it('captures the exercises in the order they were performed', async () => {
    await logAdHocSession('w1', [
      [BENCH, 3],
      [SQUAT, 4],
    ]);

    await saveWorkoutAsRoutine({ workoutId: 'w1', routineId: 'r1', name: 'Push A' });

    const entries = await routineExercisesQuery('r1');
    expect(entries.map((entry) => entry.name)).toEqual(['Bench Press', 'Back Squat']);
  });

  it('takes target sets from how many sets were actually logged', async () => {
    await logAdHocSession('w1', [
      [BENCH, 3],
      [SQUAT, 5],
    ]);

    await saveWorkoutAsRoutine({ workoutId: 'w1', routineId: 'r1', name: 'Push A' });

    const entries = await routineExercisesQuery('r1');
    expect(entries.map((entry) => entry.targetSets)).toEqual([3, 5]);
  });

  it('leaves out an exercise removed during the session', async () => {
    await logAdHocSession('w1', [
      [BENCH, 3],
      [SQUAT, 2],
    ]);
    await workoutRepository.removeWorkoutExercise('w1-e0');

    await saveWorkoutAsRoutine({ workoutId: 'w1', routineId: 'r1', name: 'Push A' });

    const entries = await routineExercisesQuery('r1');
    expect(entries.map((entry) => entry.name)).toEqual(['Back Squat']);
  });

  it('refuses to save a session with no exercises', async () => {
    await workoutRepository.startWorkout({ id: 'w1', name: 'Empty', startedAt: new Date() });

    await expect(
      saveWorkoutAsRoutine({ workoutId: 'w1', routineId: 'r1', name: 'Push A' }),
    ).rejects.toThrow(/no exercises/);
  });
});

describe('starting a workout from a routine', () => {
  it('opens the exercises in routine order', async () => {
    await buildRoutine('r1', [
      [SQUAT, 3],
      [BENCH, 4],
    ]);
    await startWorkoutFromRoutine('r1', 'w1');

    const entries = await workoutExercisesQuery('w1');

    expect(entries.map((entry) => entry.name)).toEqual(['Back Squat', 'Bench Press']);
  });

  it('pre-creates one empty set row per target set', async () => {
    await buildRoutine('r1', [
      [SQUAT, 3],
      [BENCH, 4],
    ]);
    await startWorkoutFromRoutine('r1', 'w1');

    const logged = await workoutSetsQuery('w1');

    expect(logged).toHaveLength(7);
    expect(logged.every((set) => set.completedAt === null)).toBe(true);
  });

  it('records which routine the session came from', async () => {
    await buildRoutine('r1', [[SQUAT, 1]]);
    await startWorkoutFromRoutine('r1', 'w1');

    const [workout] = await database.select().from(workouts).where(eq(workouts.id, 'w1'));

    expect(workout.routineId).toBe('r1');
    expect(workout.name).toBe('Push A');
  });

  it('copies the plan rather than referencing it, so later edits do not rewrite history', async () => {
    await buildRoutine('r1', [[SQUAT, 2]]);
    await startWorkoutFromRoutine('r1', 'w1');

    await repository.removeRoutineExercise('r1-0');
    await repository.renameRoutine('r1', 'Renamed');

    const entries = await workoutExercisesQuery('w1');
    expect(entries.map((entry) => entry.name)).toEqual(['Back Squat']);
    expect(await workoutSetsQuery('w1')).toHaveLength(2);
  });

  it('opens each set with what was lifted last time', async () => {
    await buildRoutine('r1', [[SQUAT, 2]]);
    await startWorkoutFromRoutine('r1', 'w1');

    // Perform the session, then finish it so it counts as history.
    const logged = await workoutSetsQuery('w1');
    await workoutRepository.completeSet(logged[0].id, { weightKg: 100, reps: 5 });
    await workoutRepository.completeSet(logged[1].id, { weightKg: 105, reps: 4 });
    await workoutRepository.finishWorkout('w1');

    await startWorkoutFromRoutine('r1', 'w2');

    const opened = await workoutSetsQuery('w2');
    expect(opened.map((set) => [set.weightKg, set.reps])).toEqual([
      [100, 5],
      [105, 4],
    ]);
  });

  it('leaves the pre-filled sets uncompleted, so nothing counts as performed', async () => {
    await buildRoutine('r1', [[SQUAT, 1]]);
    await startWorkoutFromRoutine('r1', 'w1');
    const [first] = await workoutSetsQuery('w1');
    await workoutRepository.completeSet(first.id, { weightKg: 100, reps: 5 });
    await workoutRepository.finishWorkout('w1');

    await startWorkoutFromRoutine('r1', 'w2');

    const [opened] = await workoutSetsQuery('w2');
    expect(opened.weightKg).toBe(100);
    expect(opened.completedAt).toBeNull();
    // And so the new session contributes nothing to history until it is ticked off.
    expect(await loadPreviousPerformance(SQUAT, 'w3')).toEqual([
      { position: 0, weightKg: 100, reps: 5 },
    ]);
  });

  it('opens blank the first time an exercise is trained', async () => {
    await buildRoutine('r1', [[BENCH, 2]]);
    await startWorkoutFromRoutine('r1', 'w1');

    const opened = await workoutSetsQuery('w1');
    expect(opened.every((set) => set.weightKg === null && set.reps === null)).toBe(true);
  });

  it('refuses to start from a routine that no longer exists', async () => {
    await expect(startWorkoutFromRoutine('missing', 'w1')).rejects.toThrow(/no longer exists/);
  });

  it('skips an entry whose exercise no longer exists rather than failing to start', async () => {
    await buildRoutine('r1', [[SQUAT, 2]]);
    // Forced in directly: foreign keys stop the repository from creating one.
    const now = new Date();
    await database.run('PRAGMA foreign_keys = OFF');
    await database.insert(routineExercises).values({
      id: 'r1-ghost',
      createdAt: now,
      updatedAt: now,
      routineId: 'r1',
      exerciseId: 'catalogue:does-not-exist',
      position: 1,
      targetSets: 3,
    });
    await database.run('PRAGMA foreign_keys = ON');

    await startWorkoutFromRoutine('r1', 'w1');

    // The join against exercises drops the dangling entry, so the session still opens.
    expect(await workoutExercisesQuery('w1')).toHaveLength(1);
    expect(await workoutSetsQuery('w1')).toHaveLength(2);
  });
});
