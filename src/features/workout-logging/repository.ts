import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { logChange, withTimestamps } from '@/db/mutation';
import { sets, workoutExercises, workouts } from '@/db/schema';
import type { SetType } from '@/db/schema';

const WORKOUTS = 'workouts';
const WORKOUT_EXERCISES = 'workout_exercises';
const SETS = 'sets';

export type NewWorkout = {
  id: string;
  name: string;
  startedAt: Date;
};

export async function startWorkout(workout: NewWorkout): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(workouts).values(withTimestamps(workout));
    await logChange(tx, { entityTable: WORKOUTS, entityId: workout.id, operation: 'insert' });
  });
}

export type NewWorkoutExercise = {
  id: string;
  workoutId: string;
  exerciseId: string;
  position: number;
};

export async function addExerciseToWorkout(entry: NewWorkoutExercise): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(workoutExercises).values(withTimestamps(entry));
    await logChange(tx, {
      entityTable: WORKOUT_EXERCISES,
      entityId: entry.id,
      operation: 'insert',
    });
  });
}

export type NewSet = {
  id: string;
  workoutExerciseId: string;
  exerciseId: string;
  position: number;
  setType: SetType;
};

/**
 * Creates the set row the moment it appears in the logger, before any value is
 * entered. Persisting up front is what makes a force-quit mid-set recoverable —
 * an in-memory-only row would simply vanish.
 */
export async function addSet(set: NewSet): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(sets).values(withTimestamps(set));
    await logChange(tx, { entityTable: SETS, entityId: set.id, operation: 'insert' });
  });
}

export type SetValues = {
  weightKg: number | null;
  reps: number | null;
  rpe?: number | null;
  durationSeconds?: number | null;
};

/** Marks a set done and stamps the moment, which is what history queries order by. */
export async function completeSet(setId: string, values: SetValues): Promise<void> {
  await updateSetRow(setId, { ...values, completedAt: new Date() });
}

/** Reverts a completion without discarding what was typed. */
export async function uncompleteSet(setId: string): Promise<void> {
  await updateSetRow(setId, { completedAt: null });
}

async function updateSetRow(setId: string, changes: Partial<typeof sets.$inferInsert>) {
  await database.transaction(async (tx) => {
    await tx
      .update(sets)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(sets.id, setId));
    await logChange(tx, { entityTable: SETS, entityId: setId, operation: 'update' });
  });
}

export async function removeSet(setId: string): Promise<void> {
  await softDelete(sets, setId, SETS);
}

export async function removeWorkoutExercise(workoutExerciseId: string): Promise<void> {
  await softDelete(workoutExercises, workoutExerciseId, WORKOUT_EXERCISES);
}

type SoftDeletable = typeof sets | typeof workoutExercises | typeof workouts;

async function softDelete(table: SoftDeletable, rowId: string, tableName: string) {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx.update(table).set({ deletedAt: now, updatedAt: now }).where(eq(table.id, rowId));
    await logChange(tx, { entityTable: tableName, entityId: rowId, operation: 'delete' });
  });
}

export async function finishWorkout(workoutId: string): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(workouts)
      .set({ endedAt: now, updatedAt: now })
      .where(eq(workouts.id, workoutId));
    await logChange(tx, { entityTable: WORKOUTS, entityId: workoutId, operation: 'update' });
  });
}

/** Abandons a session outright. The tombstone is what a future sync merges on. */
export async function discardWorkout(workoutId: string): Promise<void> {
  await softDelete(workouts, workoutId, WORKOUTS);
}
