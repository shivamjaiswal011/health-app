import { addDays, format, parseISO } from 'date-fns';

/**
 * A day as the user thinks of it — `YYYY-MM-DD` in their own timezone, not an instant.
 * Breakfast eaten at 8am belongs to that morning whether or not the user later flies
 * across a date line, so meals are filed against this rather than a timestamp.
 */
export type CalendarDay = string;

export function toCalendarDay(moment: Date): CalendarDay {
  return format(moment, 'yyyy-MM-dd');
}

export function today(): CalendarDay {
  return toCalendarDay(new Date());
}

export function shiftDay(day: CalendarDay, byDays: number): CalendarDay {
  return toCalendarDay(addDays(parseISO(day), byDays));
}

/** Human-readable heading for the day view. */
export function describeDay(day: CalendarDay, relativeTo: CalendarDay): string {
  if (day === relativeTo) return 'Today';
  if (day === shiftDay(relativeTo, -1)) return 'Yesterday';
  if (day === shiftDay(relativeTo, 1)) return 'Tomorrow';
  return format(parseISO(day), 'EEE d MMM');
}
