import { describe, expect, it } from 'vitest';

import { describeDay, shiftDay, toCalendarDay } from './calendar-day';

describe('toCalendarDay', () => {
  it('formats a moment as its local calendar day', () => {
    expect(toCalendarDay(new Date(2026, 8, 4, 14, 30))).toBe('2026-09-04');
  });

  it('keeps late-evening meals on the day the user ate them', () => {
    expect(toCalendarDay(new Date(2026, 8, 4, 23, 59))).toBe('2026-09-04');
  });
});

describe('shiftDay', () => {
  it('moves forward', () => {
    expect(shiftDay('2026-09-04', 1)).toBe('2026-09-05');
  });

  it('moves backward', () => {
    expect(shiftDay('2026-09-04', -1)).toBe('2026-09-03');
  });

  it('crosses a month boundary', () => {
    expect(shiftDay('2026-08-31', 1)).toBe('2026-09-01');
  });

  it('crosses a year boundary', () => {
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles a leap day', () => {
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('describeDay', () => {
  const now = '2026-09-04';

  it.each([
    ['2026-09-04', 'Today'],
    ['2026-09-03', 'Yesterday'],
    ['2026-09-05', 'Tomorrow'],
  ])('names %s as "%s"', (day, expected) => {
    expect(describeDay(day, now)).toBe(expected);
  });

  it('falls back to a dated heading further out', () => {
    expect(describeDay('2026-08-30', now)).toBe('Sun 30 Aug');
  });
});
