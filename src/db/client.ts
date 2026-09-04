import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

const USER_DATABASE_NAME = 'user.db';

/**
 * WAL keeps reads from blocking during a write — the set logger commits while the
 * history list is still on screen. Foreign keys are off by default in SQLite and
 * must be enabled per connection.
 */
function applyConnectionPragmas(connection: SQLite.SQLiteDatabase): void {
  connection.execSync('PRAGMA journal_mode = WAL;');
  connection.execSync('PRAGMA foreign_keys = ON;');
}

function openUserDatabase(): SQLite.SQLiteDatabase {
  // `enableChangeListener` is what powers Drizzle's useLiveQuery.
  const connection = SQLite.openDatabaseSync(USER_DATABASE_NAME, { enableChangeListener: true });
  applyConnectionPragmas(connection);
  return connection;
}

export const database = drizzle(openUserDatabase(), { schema });

export type Database = typeof database;
