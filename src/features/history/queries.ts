import { and, eq, isNull } from 'drizzle-orm';

import { database } from '@/db/client';
import { workouts } from '@/db/schema';

/**
 * A past session's header. Separate from the logger's `workoutQuery` because history
 * needs the end of the session to report how long it ran, which a session still being
 * logged does not have.
 */
export function pastWorkoutQuery(workoutId: string) {
  return database
    .select({
      id: workouts.id,
      name: workouts.name,
      startedAt: workouts.startedAt,
      endedAt: workouts.endedAt,
    })
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), isNull(workouts.deletedAt)))
    .limit(1);
}
