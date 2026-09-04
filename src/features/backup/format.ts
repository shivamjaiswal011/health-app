/**
 * The backup file contract, kept free of any database import so that validating a file
 * — the part that must work before anything is written — does not require the app's
 * storage to be available at all.
 *
 * Bumped whenever the shape changes in a way an older build could not read. Import
 * refuses anything newer than it understands rather than guessing.
 */
export const BACKUP_FORMAT_VERSION = 1;

export type Backup = {
  formatVersion: number;
  exportedAt: string;
  tables: Record<string, unknown[]>;
};
