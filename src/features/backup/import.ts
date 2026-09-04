import { BACKUP_FORMAT_VERSION, type Backup } from './format';

export type BackupProblem = { reason: string };

/**
 * Checks a file is a backup this build can read before anything is written.
 *
 * Import replaces the user's data, so a half-understood file is the one case where
 * refusing outright is kinder than doing your best.
 */
export function validateBackup(candidate: unknown): BackupProblem | null {
  if (typeof candidate !== 'object' || candidate === null) {
    return { reason: 'That file is not a backup.' };
  }

  const backup = candidate as Partial<Backup>;

  if (typeof backup.formatVersion !== 'number') {
    return { reason: 'That file is missing its format version, so it cannot be read safely.' };
  }

  if (backup.formatVersion > BACKUP_FORMAT_VERSION) {
    return {
      reason: `That backup was made by a newer version of the app (format ${backup.formatVersion}). Update the app and try again.`,
    };
  }

  if (typeof backup.tables !== 'object' || backup.tables === null) {
    return { reason: 'That backup has no data in it.' };
  }

  const notAnArray = Object.entries(backup.tables).find(([, rows]) => !Array.isArray(rows));
  if (notAnArray) {
    return { reason: `The "${notAnArray[0]}" section of that backup is malformed.` };
  }

  return null;
}
