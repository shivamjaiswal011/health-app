import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { newId } from '@/db/id';
import { logChange, withTimestamps, type Executor } from '@/db/mutation';
import { sets, workoutExercises, workouts } from '@/db/schema';
import type { PlannedSet } from '@/domain/training/prefill';
import type { WeightUnit } from '@/domain/units/weight';
import type { SetType } from '@/db/schema';

const WORKOUTS = 'workouts';
const WORKOUT_EXERCISES = 'workout_exercises';
const SETS = 'sets';

export type NewWorkout = {
  id: string;
  name: string;
  startedAt: Date;
  routineId?: string;
};

export async function startWorkout(workout: NewWorkout): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(workouts).values(withTimestamps(workout));
    await logChange(tx, { entityTable: WORKOUTS, entityId: workout.id, operation: 'insert' });
  });
}

export type PlannedExercise = {
  exerciseId: string;
  /** One entry per set to open, carrying whatever it should start with. */
  sets: PlannedSet[];
};

type PlannedExercisePlacement = {
  workoutId: string;
  planned: PlannedExercise;
  position: number;
};

async function insertPlannedExercise(tx: Executor, placement: PlannedExercisePlacement) {
  const { workoutId, planned, position } = placement;
  const entryId = newId();
  await tx
    .insert(workoutExercises)
    .values(withTimestamps({ id: entryId, workoutId, exerciseId: planned.exerciseId, position }));
  await logChange(tx, {
    entityTable: WORKOUT_EXERCISES,
    entityId: entryId,
    operation: 'insert',
  });

  for (const [slot, planningSet] of planned.sets.entries()) {
    const setId = newId();
    await tx.insert(sets).values(
      withTimestamps({
        id: setId,
        workoutExerciseId: entryId,
        exerciseId: planned.exerciseId,
        position: slot,
        setType: planningSet.setType,
        // Opened with last session's numbers but deliberately not completed: the
        // lifter still ticks every set, so nothing is recorded that was not done.
        weightKg: planningSet.weightKg,
        weightUnit: planningSet.weightUnit,
        reps: planningSet.reps,
      }),
    );
    await logChange(tx, { entityTable: SETS, entityId: setId, operation: 'insert' });
  }
}

/**
 * Starts a session from a routine: the exercises in order, each with its set rows
 * already opened and carrying whatever the caller planned for them.
 *
 * Written as one transaction rather than by composing the individual repository
 * calls, so a failure part-way cannot leave a half-built session behind.
 */
export async function startPlannedWorkout(
  workout: NewWorkout,
  plan: PlannedExercise[],
): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(workouts).values(withTimestamps(workout));
    await logChange(tx, { entityTable: WORKOUTS, entityId: workout.id, operation: 'insert' });

    for (const [position, planned] of plan.entries()) {
      await insertPlannedExercise(tx, { workoutId: workout.id, planned, position });
    }
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
  weightKg?: number | null;
  weightUnit?: WeightUnit;
  reps?: number | null;
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
  weightUnit?: WeightUnit;
  reps: number | null;
  rpe?: number | null;
  durationSeconds?: number | null;
};

/** Marks a set done and stamps the moment, which is what history queries order by. */
export async function completeSet(setId: string, values: SetValues): Promise<void> {
  await updateSetRow(setId, { ...values, completedAt: new Date() });
}

/**
 * Corrects what was lifted without touching whether the set is done. Editing an
 * already-completed set has to persist — a lifter fixing a mistyped weight after
 * ticking it off is normal, and losing that edit is silent data loss.
 */
export async function updateSetValues(setId: string, values: SetValues): Promise<void> {
  await updateSetRow(setId, values);
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
