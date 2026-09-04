import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';

import { buildBackup, countRows } from './export';

const ISO_DATE_LENGTH = 10;

function backupFileName(): string {
  const stamp = new Date().toISOString().slice(0, ISO_DATE_LENGTH);
  return `health-app-backup-${stamp}.json`;
}

export type BackupResult = {
  rows: number;
  fileName: string;
};

/**
 * Writes the backup to a file and hands it to the system share sheet, which is what
 * lets the user put it in iCloud, Drive, or anywhere else they trust. The app never
 * uploads it anywhere itself — where a backup goes is the user's decision.
 */
export async function shareBackup(): Promise<BackupResult> {
  const backup = await buildBackup();
  const fileName = backupFileName();

  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup));

  await Share.share({ url: file.uri, title: fileName });

  return { rows: countRows(backup), fileName };
}
