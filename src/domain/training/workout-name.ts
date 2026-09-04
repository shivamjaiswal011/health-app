const MORNING_ENDS_AT_HOUR = 12;
const AFTERNOON_ENDS_AT_HOUR = 17;

/**
 * Default name for a session started at a given time — the same convention lifters
 * already recognise from other trackers. Users rename freely; this only has to be a
 * sensible starting point rather than "Workout 47".
 */
export function defaultWorkoutName(startedAt: Date): string {
  const hour = startedAt.getHours();
  if (hour < MORNING_ENDS_AT_HOUR) return 'Morning Workout';
  if (hour < AFTERNOON_ENDS_AT_HOUR) return 'Afternoon Workout';
  return 'Evening Workout';
}
