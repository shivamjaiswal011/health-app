import { count, isNull } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { database } from './client';

/** Any user-owned table, all of which carry the soft-delete tombstone. */
export type SoftDeletableTable = SQLiteTable & { deletedAt: SQLiteColumn };

/**
 * Counts live rows in SQL rather than fetching them to measure `.length`.
 * Deleted rows are tombstones, not history — they never count.
 */
export function countActiveRows(table: SoftDeletableTable) {
  return database.select({ value: count() }).from(table).where(isNull(table.deletedAt));
}
