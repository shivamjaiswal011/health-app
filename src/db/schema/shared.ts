import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Columns every user-owned table carries. Present from v1 even though the app is
 * local-only, because adding them later means migrating live user data.
 *
 * `id` is a UUIDv7 — time-sortable, and collision-free across devices once sync exists.
 * `deletedAt` marks a soft delete; tombstones are what let a future merge distinguish
 * "deleted on the other device" from "not yet synced".
 */
export const syncColumns = {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
};

export const CHANGE_OPERATIONS = ['insert', 'update', 'delete'] as const;
export type ChangeOperation = (typeof CHANGE_OPERATIONS)[number];

/**
 * Append-only record of every mutation, written by the repository layer.
 * In v1 it backs undo and the export file; in v2 it becomes the sync oplog unchanged.
 */
export const changeLog = sqliteTable('change_log', {
  id: text('id').primaryKey(),
  entityTable: text('entity_table').notNull(),
  entityId: text('entity_id').notNull(),
  operation: text('operation', { enum: CHANGE_OPERATIONS }).notNull(),
  occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
});

export type ChangeLogRow = typeof changeLog.$inferSelect;
