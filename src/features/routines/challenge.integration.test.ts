import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', async () => {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const schema = await import('@/db/schema');
  return { database: drizzle(createClient({ url: ':memory:' }), { schema }) };
});

const { database } = await import('@/db/client');
const { workoutSetsQuery } = await import('@/features/workout-logging/queries');
const { startWorkoutFromRoutine } = await import('./start-from-routine');
const { applyMigrations, buildRoutine, resetDatabase, SQUAT } =
  await import('./routine-test-harness');
const repository = await import('./repository');
const workoutRepository = await import('@/features/workout-logging/repository');

beforeAll(async () => {
  await database.run('PRAGMA foreign_keys = ON');
  await applyMigrations();
});

beforeEach(resetDatabase);

const CHALLENGE_PREFERENCES = {
  fallbackUnit: 'kg' as const,
  challenge: { backoffSets: true, defaultRange: { low: 8, high: 12 } },
};

/** Ticks off every open set of the session at the given numbers, then finishes it. */
async function performSession(workoutId: string, weightKg: number, reps: number) {
  for (const set of await workoutSetsQuery(workoutId)) {
    await workoutRepository.completeSet(set.id, { weightKg, reps });
  }
  await workoutRepository.finishWorkout(workoutId);
}

describe('challenge mode', () => {
  it('opens at the bottom of the range when the lift has no history', async () => {
    await buildRoutine('r1', [[SQUAT, 3]]);
    await startWorkoutFromRoutine('r1', 'w1', CHALLENGE_PREFERENCES);

    const opened = await workoutSetsQuery('w1');

    expect(opened.map((set) => [set.reps, set.setType])).toEqual([
      [8, 'working'],
      [8, 'working'],
      [8, 'working'],
      [12, 'backoff'],
    ]);
    expect(opened.every((set) => set.completedAt === null)).toBe(true);
  });

  it('asks for one more rep once the target is cleared', async () => {
    await buildRoutine('r1', [[SQUAT, 2]]);
    await startWorkoutFromRoutine('r1', 'w1', CHALLENGE_PREFERENCES);
    await performSession('w1', 60, 8);

    await startWorkoutFromRoutine('r1', 'w2', CHALLENGE_PREFERENCES);

    const working = (await workoutSetsQuery('w2')).filter((set) => set.setType === 'working');
    expect(working.map((set) => [set.weightKg, set.reps])).toEqual([
      [60, 9],
      [60, 9],
    ]);
  });

  it('re-issues the same target when one working set fell short', async () => {
    await buildRoutine('r1', [[SQUAT, 2]]);
    await startWorkoutFromRoutine('r1', 'w1', CHALLENGE_PREFERENCES);

    // Nine on the first set, eight on the second: the target of nine was not cleared.
    const opened = await workoutSetsQuery('w1');
    await workoutRepository.completeSet(opened[0].id, { weightKg: 60, reps: 9 });
    await workoutRepository.completeSet(opened[1].id, { weightKg: 60, reps: 8 });
    await workoutRepository.finishWorkout('w1');

    await startWorkoutFromRoutine('r1', 'w2', CHALLENGE_PREFERENCES);

    const working = (await workoutSetsQuery('w2')).filter((set) => set.setType === 'working');
    expect(working.map((set) => set.reps)).toEqual([9, 9]);
  });

  it('raises the weight and restarts the reps once the range is conquered', async () => {
    await buildRoutine('r1', [[SQUAT, 2]]);
    await startWorkoutFromRoutine('r1', 'w1', CHALLENGE_PREFERENCES);
    await performSession('w1', 60, 12);

    await startWorkoutFromRoutine('r1', 'w2', CHALLENGE_PREFERENCES);

    const working = (await workoutSetsQuery('w2')).filter((set) => set.setType === 'working');
    expect(working.map((set) => [set.weightKg, set.reps])).toEqual([
      [62.5, 8],
      [62.5, 8],
    ]);
  });

  it('does not let the back-off set clear the next target', async () => {
    await buildRoutine('r1', [[SQUAT, 2]]);
    await startWorkoutFromRoutine('r1', 'w1', CHALLENGE_PREFERENCES);

    // Eight on both working sets, twelve on the light back-off set. Counting the
    // back-off reps would conquer the whole range in a single session.
    const opened = await workoutSetsQuery('w1');
    await workoutRepository.completeSet(opened[0].id, { weightKg: 60, reps: 8 });
    await workoutRepository.completeSet(opened[1].id, { weightKg: 60, reps: 8 });
    await workoutRepository.completeSet(opened[2].id, { weightKg: 48, reps: 12 });
    await workoutRepository.finishWorkout('w1');

    await startWorkoutFromRoutine('r1', 'w2', CHALLENGE_PREFERENCES);

    const working = (await workoutSetsQuery('w2')).filter((set) => set.setType === 'working');
    expect(working.map((set) => [set.weightKg, set.reps])).toEqual([
      [60, 9],
      [60, 9],
    ]);
  });

  it('keeps a lift logged in pounds in pounds, and steps it in pounds', async () => {
    await buildRoutine('r1', [[SQUAT, 1]]);
    await startWorkoutFromRoutine('r1', 'w1', CHALLENGE_PREFERENCES);

    const [first] = await workoutSetsQuery('w1');
    await workoutRepository.completeSet(first.id, {
      weightKg: 45.36,
      weightUnit: 'lb',
      reps: 12,
    });
    await workoutRepository.finishWorkout('w1');

    await startWorkoutFromRoutine('r1', 'w2', CHALLENGE_PREFERENCES);

    const [opened] = await workoutSetsQuery('w2');
    expect(opened.weightUnit).toBe('lb');
    expect(opened.weightKg).toBeCloseTo(45.36 + 5 / 2.20462262, 5);
  });

  it('honours a rep range pinned on the routine over the configured default', async () => {
    await repository.createRoutine({ id: 'r1', name: 'Push A', position: 0 });
    await repository.addExerciseToRoutine({
      id: 'r1-0',
      routineId: 'r1',
      exerciseId: SQUAT,
      position: 0,
      targetSets: 1,
      targetRepsLow: 3,
      targetRepsHigh: 5,
    });

    await startWorkoutFromRoutine('r1', 'w1', CHALLENGE_PREFERENCES);

    const [opened] = await workoutSetsQuery('w1');
    expect(opened.reps).toBe(3);
  });
});
