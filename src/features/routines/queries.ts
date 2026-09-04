import { and, asc, eq, isNull } from 'drizzle-orm';

import { database } from '@/db/client';
import { exercises, routineExercises, routines } from '@/db/schema';

export function routineListQuery() {
  return database
    .select({
      id: routines.id,
      name: routines.name,
      position: routines.position,
    })
    .from(routines)
    .where(isNull(routines.deletedAt))
    .orderBy(asc(routines.position), asc(routines.name));
}

export function routineQuery(routineId: string) {
  return database
    .select({ id: routines.id, name: routines.name })
    .from(routines)
    .where(and(eq(routines.id, routineId), isNull(routines.deletedAt)))
    .limit(1);
}

export type RoutineExerciseEntry = {
  id: string;
  exerciseId: string;
  name: string;
  position: number;
  targetSets: number | null;
};

export function routineExercisesQuery(routineId: string) {
  return database
    .select({
      id: routineExercises.id,
      exerciseId: exercises.id,
      name: exercises.name,
      position: routineExercises.position,
      targetSets: routineExercises.targetSets,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(and(eq(routineExercises.routineId, routineId), isNull(routineExercises.deletedAt)))
    .orderBy(asc(routineExercises.position));
}

/** One-shot read used when starting a workout, where a live subscription is pointless. */
export function loadRoutineExercises(routineId: string): Promise<RoutineExerciseEntry[]> {
  return routineExercisesQuery(routineId);
}
