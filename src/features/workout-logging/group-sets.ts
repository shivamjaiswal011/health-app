import type { LoggedSet } from './components/set-row';

type SetWithParent = LoggedSet & { workoutExerciseId: string };

/**
 * One live query returns every set in the workout; the screen needs them per exercise.
 * Grouping in JS is right here — the rows are already loaded and a session holds tens
 * of sets, not thousands.
 */
export function groupSetsByExercise(rows: SetWithParent[]): Map<string, LoggedSet[]> {
  const grouped = new Map<string, LoggedSet[]>();
  for (const row of rows) {
    const existing = grouped.get(row.workoutExerciseId);
    if (existing) existing.push(row);
    else grouped.set(row.workoutExerciseId, [row]);
  }
  return grouped;
}
