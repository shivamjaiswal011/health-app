import { and, asc, desc, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm';

import { database } from '@/db/client';
import { bodyMetrics, exercises, foodEntries, sets, workoutExercises, workouts } from '@/db/schema';

const RECENT_WEEKS = 26;

/**
 * Every completed set of one exercise, oldest first. Estimated one-rep max is derived
 * in the domain rather than in SQL so the formula lives in one place and stays tested.
 */
export function exerciseHistoryQuery(exerciseId: string) {
  return database
    .select({
      completedAt: sets.completedAt,
      weightKg: sets.weightKg,
      reps: sets.reps,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(sets.exerciseId, exerciseId),
        isNotNull(sets.completedAt),
        isNull(sets.deletedAt),
        isNull(workoutExercises.deletedAt),
        isNull(workouts.deletedAt),
      ),
    )
    .orderBy(asc(sets.completedAt));
}

/**
 * Tonnage per calendar week, summed in SQL. Pulling every set into JS to add them up
 * would move thousands of rows across the bridge to produce a few dozen numbers.
 */
export function weeklyVolumeQuery() {
  const week = sql<string>`strftime('%Y-%W', ${sets.completedAt} / 1000, 'unixepoch', 'localtime')`;

  return database
    .select({
      week,
      volume: sql<number>`coalesce(sum(${sets.weightKg} * ${sets.reps}), 0)`,
      setCount: sql<number>`count(${sets.id})`,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        isNotNull(sets.completedAt),
        isNull(sets.deletedAt),
        isNull(workoutExercises.deletedAt),
        isNull(workouts.deletedAt),
      ),
    )
    .groupBy(week)
    .orderBy(desc(week))
    .limit(RECENT_WEEKS);
}

export function bodyWeightQuery() {
  return database
    .select({ measuredOn: bodyMetrics.measuredOn, weightKg: bodyMetrics.weightKg })
    .from(bodyMetrics)
    .where(and(isNotNull(bodyMetrics.weightKg), isNull(bodyMetrics.deletedAt)))
    .orderBy(asc(bodyMetrics.measuredOn));
}

/** Calories per day, for the adherence chart and the weight-versus-intake rule. */
export function dailyEnergyQuery() {
  return database
    .select({
      day: foodEntries.loggedOn,
      kcal: sql<number>`coalesce(sum(${foodEntries.kcalAtLog}), 0)`,
      protein: sql<number>`coalesce(sum(${foodEntries.proteinAtLog}), 0)`,
    })
    .from(foodEntries)
    .where(isNull(foodEntries.deletedAt))
    .groupBy(foodEntries.loggedOn)
    .orderBy(asc(foodEntries.loggedOn));
}

/**
 * Completed sets since a cut-off, with the exercise they belong to.
 *
 * Deliberately returns rows rather than computing estimated one-rep max in SQL: the
 * formula belongs in the domain where it is tested, and duplicating it here would let
 * the chart and the insight rules quietly disagree.
 */
export function recentCompletedSetsQuery(since: Date) {
  return database
    .select({
      exerciseId: exercises.id,
      name: exercises.name,
      primaryMuscle: exercises.primaryMuscle,
      completedAt: sets.completedAt,
      weightKg: sets.weightKg,
      reps: sets.reps,
    })
    .from(sets)
    .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        isNotNull(sets.completedAt),
        gte(sets.completedAt, since),
        isNull(sets.deletedAt),
        isNull(workoutExercises.deletedAt),
        isNull(workouts.deletedAt),
      ),
    )
    .orderBy(asc(sets.completedAt));
}

/** Exercises the user has actually trained, for the progress picker. */
export function trainedExercisesQuery() {
  return database
    .selectDistinct({ id: exercises.id, name: exercises.name })
    .from(sets)
    .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
    .where(and(isNotNull(sets.completedAt), isNull(sets.deletedAt)))
    .orderBy(asc(exercises.name));
}
