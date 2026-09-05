import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { PERSONAL_RECORD_KINDS } from '@/domain/training/personal-records';
import { WEIGHT_UNITS } from '@/domain/units/weight';

import { syncColumns } from './shared';

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'full_body',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
  'other',
] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

/**
 * How a set of this exercise is measured. Drives which inputs the logger shows —
 * a plank takes duration, a pull-up takes reps, a squat takes weight and reps.
 */
export const TRACKING_MODES = [
  'weight_and_reps',
  'bodyweight_reps',
  'weighted_bodyweight',
  'duration',
  'distance_and_duration',
] as const;
export type TrackingMode = (typeof TRACKING_MODES)[number];

export const exercises = sqliteTable(
  'exercises',
  {
    ...syncColumns,
    name: text('name').notNull(),
    primaryMuscle: text('primary_muscle', { enum: MUSCLE_GROUPS }).notNull(),
    secondaryMuscles: text('secondary_muscles', { mode: 'json' })
      .$type<MuscleGroup[]>()
      .notNull()
      .default([]),
    equipment: text('equipment', { enum: EQUIPMENT_TYPES }).notNull(),
    trackingMode: text('tracking_mode', { enum: TRACKING_MODES }).notNull(),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    notes: text('notes'),
  },
  (table) => [index('idx_exercises_name').on(table.name)],
);

export const routines = sqliteTable('routines', {
  ...syncColumns,
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  notes: text('notes'),
});

export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    ...syncColumns,
    routineId: text('routine_id')
      .notNull()
      .references(() => routines.id),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
    /** Exercises sharing a non-null group are performed as a superset. */
    supersetGroup: integer('superset_group'),
    targetSets: integer('target_sets'),
    targetRepsLow: integer('target_reps_low'),
    targetRepsHigh: integer('target_reps_high'),
    targetRestSeconds: integer('target_rest_seconds'),
    notes: text('notes'),
  },
  (table) => [index('idx_routine_exercises_routine').on(table.routineId, table.position)],
);

export const workouts = sqliteTable(
  'workouts',
  {
    ...syncColumns,
    /** Null once the source routine is deleted; the performed session still stands. */
    routineId: text('routine_id').references(() => routines.id),
    name: text('name').notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    notes: text('notes'),
  },
  (table) => [index('idx_workouts_started_at').on(table.startedAt)],
);

export const workoutExercises = sqliteTable(
  'workout_exercises',
  {
    ...syncColumns,
    workoutId: text('workout_id')
      .notNull()
      .references(() => workouts.id),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
    supersetGroup: integer('superset_group'),
    notes: text('notes'),
  },
  (table) => [index('idx_workout_exercises_workout').on(table.workoutId, table.position)],
);

/** `backoff` is the lighter high-rep set challenge mode appends after the working sets. */
export const SET_TYPES = ['working', 'warmup', 'drop', 'failure', 'backoff'] as const;
export type SetType = (typeof SET_TYPES)[number];

/**
 * The hot table. `idx_sets_exercise_history` drives previous-set ghosting, which is
 * queried every time an exercise is opened during a workout and must feel instant.
 */
export const sets = sqliteTable(
  'sets',
  {
    ...syncColumns,
    workoutExerciseId: text('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id),
    /** Denormalised from the parent so history queries skip a join on the hot path. */
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
    setType: text('set_type', { enum: SET_TYPES }).notNull().default('working'),
    weightKg: real('weight_kg'),
    /** How the lifter entered it. The stored value is kilograms either way. */
    weightUnit: text('weight_unit', { enum: WEIGHT_UNITS }).notNull().default('kg'),
    reps: integer('reps'),
    rpe: real('rpe'),
    durationSeconds: integer('duration_seconds'),
    distanceMeters: real('distance_meters'),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_sets_workout_exercise').on(table.workoutExerciseId, table.position),
    index('idx_sets_exercise_history').on(table.exerciseId, table.completedAt),
  ],
);

/** Denormalised so the dashboard never recomputes PRs across all history on open. */
export const personalRecords = sqliteTable(
  'personal_records',
  {
    ...syncColumns,
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    recordType: text('record_type', { enum: PERSONAL_RECORD_KINDS }).notNull(),
    value: real('value').notNull(),
    achievedAt: integer('achieved_at', { mode: 'timestamp_ms' }).notNull(),
    setId: text('set_id').references(() => sets.id),
  },
  (table) => [index('idx_personal_records_exercise').on(table.exerciseId, table.recordType)],
);

export type Exercise = typeof exercises.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type PerformedSet = typeof sets.$inferSelect;
export type PersonalRecord = typeof personalRecords.$inferSelect;
