import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import { logChange, withTimestamps } from '@/db/mutation';
import { routineExercises, routines } from '@/db/schema';

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
