import { readFileSync } from 'node:fs';
import path from 'node:path';

import { database } from '@/db/client';
import { exercises } from '@/db/schema';
import type { MuscleGroup } from '@/domain/training/muscles';

import * as repository from './repository';

/**
 * Shared setup for the routine integration tests, which run the production repository
 * against libsql in memory.
 *
 * Each test file mocks `@/db/client` for itself, so importing this picks up that file's
 * own database — the suites cannot see each other's rows.
 */
const MIGRATIONS_DIR = path.join(__dirname, '../../db/migrations');
const STATEMENT_SEPARATOR = '--> statement-breakpoint';

/** Children first: the truncation runs with foreign keys enforced, as production does. */
export const TABLES_TO_CLEAR = [
  'change_log',
  'sets',
  'workout_exercises',
  'workouts',
  'routine_exercises',
  'routines',
  'exercises',
];

export const SQUAT = 'catalogue:squat';
export const BENCH = 'catalogue:bench';
/** A small muscle, to prove the default range follows the muscle rather than the app. */
export const CALF_RAISE = 'catalogue:calf-raise';

export async function applyMigrations(): Promise<void> {
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

export async function seedExercise(
  id: string,
  name: string,
  primaryMuscle: MuscleGroup = 'quads',
): Promise<void> {
  const now = new Date();
  await database.insert(exercises).values({
    id,
    createdAt: now,
    updatedAt: now,
    name,
    primaryMuscle,
    secondaryMuscles: [],
    equipment: 'barbell',
    trackingMode: 'weight_and_reps',
  });
}

/** Empties every table and reseeds the two exercises the suites build routines from. */
export async function resetDatabase(): Promise<void> {
  for (const table of TABLES_TO_CLEAR) {
    await database.run(`DELETE FROM ${table}`);
  }
  await seedExercise(SQUAT, 'Back Squat');
  await seedExercise(BENCH, 'Bench Press');
  await seedExercise(CALF_RAISE, 'Standing Calf Raise', 'calves');
}

/** A routine of exercises, each with a target set count, in the order given. */
export async function buildRoutine(routineId: string, plan: [string, number][]): Promise<void> {
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
