import { describe, expect, it } from 'vitest';

import { formatSessionLength, sessionMinutes, summariseSets } from './session-totals';
import type { CompletedSet } from './types';

function set(weightKg: number | null, reps: number | null): CompletedSet {
  return { exerciseId: 'squat', weightKg, reps, completedAt: new Date() };
}

describe('summariseSets', () => {
  it('counts the sets and the load they moved', () => {
    expect(summariseSets([set(100, 5), set(100, 5)])).toEqual({ setCount: 2, tonnageKg: 1000 });
  });

  it('counts a bodyweight set without inventing tonnage for it', () => {
    expect(summariseSets([set(null, 12)])).toEqual({ setCount: 1, tonnageKg: 0 });
  });

  it('is empty for a session with nothing completed', () => {
    expect(summariseSets([])).toEqual({ setCount: 0, tonnageKg: 0 });
  });
});

describe('sessionMinutes', () => {
  const started = new Date('2026-09-05T10:00:00Z');

  it('measures a finished session', () => {
    expect(sessionMinutes(started, new Date('2026-09-05T11:12:00Z'))).toBe(72);
  });

  it('reports nothing for a session still running', () => {
    expect(sessionMinutes(started, null)).toBeNull();
  });

  it('does not report a negative length when the clock has moved backwards', () => {
    expect(sessionMinutes(started, new Date('2026-09-05T09:00:00Z'))).toBe(0);
  });
});

describe('formatSessionLength', () => {
  it('reads a short session in minutes', () => {
    expect(formatSessionLength(45)).toBe('45m');
  });

  it('splits an hour out once there is one', () => {
    expect(formatSessionLength(72)).toBe('1h 12m');
  });

  it('drops the minutes when there are none', () => {
    expect(formatSessionLength(120)).toBe('2h');
  });

  it('shows a dash rather than a zero for a session with no end', () => {
    expect(formatSessionLength(null)).toBe('—');
  });
});
