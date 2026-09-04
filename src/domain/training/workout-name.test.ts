import { describe, expect, it } from 'vitest';

import { defaultWorkoutName } from './workout-name';

function at(hour: number): Date {
  return new Date(2026, 8, 4, hour, 0, 0);
}

describe('defaultWorkoutName', () => {
  it.each([
    [0, 'Morning Workout'],
    [6, 'Morning Workout'],
    [11, 'Morning Workout'],
    [12, 'Afternoon Workout'],
    [16, 'Afternoon Workout'],
    [17, 'Evening Workout'],
    [23, 'Evening Workout'],
  ])('names a session started at %i:00 "%s"', (hour, expected) => {
    expect(defaultWorkoutName(at(hour))).toBe(expected);
  });
});
