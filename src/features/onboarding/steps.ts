import type { ActivityLevel, BiologicalSex, Goal } from '@/domain/profile/energy';

export const ONBOARDING_STEPS = ['welcome', 'about', 'activity', 'goal', 'targets'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/**
 * Answers gathered so far. Everything is optional until the final step, because the
 * user can leave at any point and nothing should reach the database half-formed.
 */
export type OnboardingDraft = {
  sex: BiologicalSex | null;
  ageYears: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activity: ActivityLevel | null;
  goal: Goal | null;
};

export const EMPTY_DRAFT: OnboardingDraft = {
  sex: null,
  ageYears: null,
  heightCm: null,
  weightKg: null,
  activity: null,
  goal: null,
};

/** Whether the step the user is looking at has everything it asked for. */
export function isStepComplete(step: OnboardingStep, draft: OnboardingDraft): boolean {
  if (step === 'about') {
    return (
      draft.sex !== null &&
      draft.ageYears !== null &&
      draft.heightCm !== null &&
      draft.weightKg !== null
    );
  }
  if (step === 'activity') return draft.activity !== null;
  if (step === 'goal') return draft.goal !== null;
  return true;
}

export function nextStep(step: OnboardingStep): OnboardingStep | null {
  const index = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[index + 1] ?? null;
}

export function previousStep(step: OnboardingStep): OnboardingStep | null {
  const index = ONBOARDING_STEPS.indexOf(step);
  return index > 0 ? ONBOARDING_STEPS[index - 1] : null;
}
