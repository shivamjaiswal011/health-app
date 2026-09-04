import { newId } from './id';
import type { Database } from './client';
import { changeLog, type ChangeOperation } from './schema';

/**
 * Anything that can run an insert — the database itself or an open transaction.
 * Structural typing keeps the helpers usable in both without leaking Drizzle's
 * transaction generics through every signature.
 */
export type Executor = Pick<Database, 'insert'>;

export type NewRowColumns = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Stamps the identity and timestamps every user-owned row is required to carry. */
export function newRow<T extends object>(values: T): T & NewRowColumns {
  const now = new Date();
  return { ...values, id: newId(), createdAt: now, updatedAt: now };
}

type ChangeRecord = {
  entityTable: string;
  entityId: string;
  operation: ChangeOperation;
};

/**
 * Appends to the oplog. Must run inside the same transaction as the mutation it
 * describes — a change the log missed is a change a future sync cannot replay.
 */
export function logChange(executor: Executor, change: ChangeRecord) {
  return executor.insert(changeLog).values({
    id: newId(),
    occurredAt: new Date(),
    ...change,
  });
}
