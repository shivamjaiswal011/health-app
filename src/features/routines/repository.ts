import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { newId } from '@/db/id';
import { logChange, withTimestamps } from '@/db/mutation';
import { routineExercises, routines } from '@/db/schema';
import type { RepRange } from '@/domain/training/challenge';

const ROUTINES = 'routines';
const ROUTINE_EXERCISES = 'routine_exercises';

export type NewRoutine = {
  id: string;
  name: string;
  position: number;
};

export async function createRoutine(routine: NewRoutine): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(routines).values(withTimestamps(routine));
    await logChange(tx, { entityTable: ROUTINES, entityId: routine.id, operation: 'insert' });
  });
}

export type PlannedRoutineExercise = {
  exerciseId: string;
  targetSets: number;
};

/**
 * Creates a routine and its exercises together. One transaction because a routine that
 * half-saved is worse than one that did not save at all — the user would find a
 * plausible-looking routine missing exercises they thought they had captured.
 */
export async function createRoutineWithExercises(
  routine: NewRoutine,
  plan: PlannedRoutineExercise[],
): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(routines).values(withTimestamps(routine));
    await logChange(tx, { entityTable: ROUTINES, entityId: routine.id, operation: 'insert' });

    for (const [position, planned] of plan.entries()) {
      const entryId = newId();
      await tx.insert(routineExercises).values(
        withTimestamps({
          id: entryId,
          routineId: routine.id,
          exerciseId: planned.exerciseId,
          position,
          targetSets: planned.targetSets,
        }),
      );
      await logChange(tx, {
        entityTable: ROUTINE_EXERCISES,
        entityId: entryId,
        operation: 'insert',
      });
    }
  });
}

export async function renameRoutine(routineId: string, name: string): Promise<void> {
  await database.transaction(async (tx) => {
    await tx
      .update(routines)
      .set({ name, updatedAt: new Date() })
      .where(eq(routines.id, routineId));
    await logChange(tx, { entityTable: ROUTINES, entityId: routineId, operation: 'update' });
  });
}

export type NewRoutineExercise = {
  id: string;
  routineId: string;
  exerciseId: string;
  position: number;
  targetSets: number;
  /** Challenge mode's rep range. Left unset, the exercise uses the configured default. */
  targetRepsLow?: number;
  targetRepsHigh?: number;
};

export async function addExerciseToRoutine(entry: NewRoutineExercise): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.insert(routineExercises).values(withTimestamps(entry));
    await logChange(tx, {
      entityTable: ROUTINE_EXERCISES,
      entityId: entry.id,
      operation: 'insert',
    });
  });
}

export async function setTargetSets(routineExerciseId: string, targetSets: number): Promise<void> {
  await database.transaction(async (tx) => {
    await tx
      .update(routineExercises)
      .set({ targetSets, updatedAt: new Date() })
      .where(eq(routineExercises.id, routineExerciseId));
    await logChange(tx, {
      entityTable: ROUTINE_EXERCISES,
      entityId: routineExerciseId,
      operation: 'update',
    });
  });
}

/**
 * Pins the rep range challenge mode ladders through for one exercise. Stored on the
 * routine rather than the exercise: the same lift is trained for strength in one
 * routine and for volume in another.
 */
export async function setRepRange(routineExerciseId: string, range: RepRange): Promise<void> {
  await database.transaction(async (tx) => {
    await tx
      .update(routineExercises)
      .set({ targetRepsLow: range.low, targetRepsHigh: range.high, updatedAt: new Date() })
      .where(eq(routineExercises.id, routineExerciseId));
    await logChange(tx, {
      entityTable: ROUTINE_EXERCISES,
      entityId: routineExerciseId,
      operation: 'update',
    });
  });
}

/**
 * Rewrites the whole ordering in one transaction. Reordering is inherently a
 * statement about the entire list, and writing it atomically means a failure
 * mid-way cannot leave two exercises claiming the same slot.
 */
export async function reorderRoutineExercises(orderedIds: string[]): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    for (const [position, id] of orderedIds.entries()) {
      await tx
        .update(routineExercises)
        .set({ position, updatedAt: now })
        .where(eq(routineExercises.id, id));
      await logChange(tx, {
        entityTable: ROUTINE_EXERCISES,
        entityId: id,
        operation: 'update',
      });
    }
  });
}

export async function removeRoutineExercise(routineExerciseId: string): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(routineExercises)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(routineExercises.id, routineExerciseId));
    await logChange(tx, {
      entityTable: ROUTINE_EXERCISES,
      entityId: routineExerciseId,
      operation: 'delete',
    });
  });
}

export async function deleteRoutine(routineId: string): Promise<void> {
  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(routines)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(routines.id, routineId));
    await logChange(tx, { entityTable: ROUTINES, entityId: routineId, operation: 'delete' });
  });
}
