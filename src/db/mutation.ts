import type { Database } from './client';
import { newId } from './id';
import { changeLog, type ChangeOperation } from './schema';

/**
 * Anything that can run an insert — the database itself or an open transaction.
 * Structural typing keeps the helpers usable in both without leaking Drizzle's
 * transaction generics through every signature.
 */
export type Executor = Pick<Database, 'insert'>;

export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Stamps the timestamps every user-owned row is required to carry.
 *
 * Ids are supplied by the caller rather than generated here: a repository function
 * that both writes a row and returns its new id would be a command and a query at
 * once, and callers need the id before the write to build related rows anyway.
 */
export function withTimestamps<T extends object>(values: T): T & Timestamps {
  const now = new Date();
  return { ...values, createdAt: now, updatedAt: now };
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
