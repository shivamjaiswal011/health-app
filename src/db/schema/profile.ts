import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ACTIVITY_LEVELS, BIOLOGICAL_SEXES, GOALS } from '@/domain/profile/energy';

import { syncColumns } from './shared';

/**
 * What the user told us about themselves, so targets can be derived and insights can
 * know which direction is the right one.
 *
 * Effective-dated like nutrition targets rather than mutated in place: someone who was
 * bulking in March and cutting in September should not have March's sessions rejudged
 * against today's goal.
 */
export const profiles = sqliteTable('profiles', {
  ...syncColumns,
  effectiveFrom: text('effective_from').notNull(),
  sex: text('sex', { enum: BIOLOGICAL_SEXES }).notNull(),
  ageYears: integer('age_years').notNull(),
  heightCm: real('height_cm').notNull(),
  activity: text('activity', { enum: ACTIVITY_LEVELS }).notNull(),
  goal: text('goal', { enum: GOALS }).notNull(),
});

export type Profile = typeof profiles.$inferSelect;
