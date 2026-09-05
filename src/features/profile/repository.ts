import { and, desc, eq, isNotNull, isNull, lte } from 'drizzle-orm';

import { database } from '@/db/client';
import { newId } from '@/db/id';
import { logChange, withTimestamps } from '@/db/mutation';
import { bodyMetrics, nutritionTargets, profiles } from '@/db/schema';
import type { ActivityLevel, BiologicalSex, Goal } from '@/domain/profile/energy';
import type { MacroTargets } from '@/domain/profile/macros-from-goal';

const PROFILES = 'profiles';
const NUTRITION_TARGETS = 'nutrition_targets';
const BODY_METRICS = 'body_metrics';

export type NewProfile = {
  effectiveFrom: string;
  sex: BiologicalSex;
  ageYears: number;
  heightCm: number;
  activity: ActivityLevel;
  goal: Goal;
};

export type OnboardingResult = {
  profile: NewProfile;
  weightKg: number;
  targets: MacroTargets;
};

/**
 * Writes everything onboarding gathered in one transaction: who the user is, their
 * first weigh-in, and the targets derived from both.
 *
 * Atomic because these three only make sense together — a profile without targets
 * would leave the app in exactly the state onboarding exists to prevent, and the user
 * would have no way to tell it had half-worked.
 */
export async function completeOnboarding(result: OnboardingResult): Promise<void> {
  const { profile, weightKg, targets } = result;
  const day = profile.effectiveFrom;

  await database.transaction(async (tx) => {
    const profileId = newId();
    await tx.insert(profiles).values(withTimestamps({ id: profileId, ...profile }));
    await logChange(tx, { entityTable: PROFILES, entityId: profileId, operation: 'insert' });

    const weightId = newId();
    await tx
      .insert(bodyMetrics)
      .values(withTimestamps({ id: weightId, measuredOn: day, weightKg }));
    await logChange(tx, { entityTable: BODY_METRICS, entityId: weightId, operation: 'insert' });

    const targetId = newId();
    await tx
      .insert(nutritionTargets)
      .values(withTimestamps({ id: targetId, effectiveFrom: day, ...targets }));
    await logChange(tx, {
      entityTable: NUTRITION_TARGETS,
      entityId: targetId,
      operation: 'insert',
    });
  });
}

/** The profile in force on a given day, mirroring how targets are read. */
export function profileForDayQuery(day: string) {
  return database
    .select({
      sex: profiles.sex,
      ageYears: profiles.ageYears,
      heightCm: profiles.heightCm,
      activity: profiles.activity,
      goal: profiles.goal,
    })
    .from(profiles)
    .where(and(lte(profiles.effectiveFrom, day), isNull(profiles.deletedAt)))
    .orderBy(desc(profiles.effectiveFrom))
    .limit(1);
}

/** Whether onboarding has ever been completed. Drives the first-run redirect. */
export async function hasProfile(): Promise<boolean> {
  const [existing] = await database
    .select({ id: profiles.id })
    .from(profiles)
    .where(isNull(profiles.deletedAt))
    .limit(1);
  return existing !== undefined;
}

export async function updateGoal(profileId: string, goal: Goal): Promise<void> {
  await database.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ goal, updatedAt: new Date() })
      .where(eq(profiles.id, profileId));
    await logChange(tx, { entityTable: PROFILES, entityId: profileId, operation: 'update' });
  });
}

/** The most recent weigh-in, which the profile screen reports alongside height and age. */
export function latestWeighInQuery() {
  return database
    .select({ weightKg: bodyMetrics.weightKg, measuredOn: bodyMetrics.measuredOn })
    .from(bodyMetrics)
    .where(and(isNotNull(bodyMetrics.weightKg), isNull(bodyMetrics.deletedAt)))
    .orderBy(desc(bodyMetrics.measuredOn))
    .limit(1);
}
