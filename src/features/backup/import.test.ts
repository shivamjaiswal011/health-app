import { describe, expect, it } from 'vitest';

import { BACKUP_FORMAT_VERSION } from './format';
import { validateBackup } from './import';

function backup(overrides: Record<string, unknown> = {}) {
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: '2026-09-04T00:00:00.000Z',
    tables: { sets: [], workouts: [] },
    ...overrides,
  };
}

describe('validateBackup', () => {
  it('accepts a backup this build wrote', () => {
    expect(validateBackup(backup())).toBeNull();
  });

  it('accepts an older format', () => {
    expect(validateBackup(backup({ formatVersion: BACKUP_FORMAT_VERSION - 1 }))).toBeNull();
  });

  it('refuses a backup from a newer app rather than guessing at it', () => {
    const problem = validateBackup(backup({ formatVersion: BACKUP_FORMAT_VERSION + 1 }));
    expect(problem?.reason).toContain('newer version');
  });

  it.each([
    ['a string', 'not a backup'],
    ['null', null],
    ['a number', 42],
  ])('refuses %s', (_label, candidate) => {
    expect(validateBackup(candidate)).not.toBeNull();
  });

  it('refuses a file with no format version', () => {
    const { formatVersion, ...withoutVersion } = backup();
    expect(validateBackup(withoutVersion)?.reason).toContain('format version');
  });

  it('refuses a file with no tables', () => {
    expect(validateBackup(backup({ tables: undefined }))?.reason).toContain('no data');
  });

  it('names the section that is malformed', () => {
    const problem = validateBackup(backup({ tables: { sets: [], workouts: 'oops' } }));
    expect(problem?.reason).toContain('workouts');
  });
});
