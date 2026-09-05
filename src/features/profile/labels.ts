import type { ActivityLevel, BiologicalSex, Goal } from '@/domain/profile/energy';

export type Choice<T> = { value: T; label: string; detail: string };

/**
 * How the profile's stored values read to a person. Shared by onboarding and the
 * profile screen so the wording someone chose during setup is the wording they see
 * afterwards — the same value described two ways reads as two different answers.
 */
export const ACTIVITY_CHOICES: Choice<ActivityLevel>[] = [
  { value: 'sedentary', label: 'Sedentary', detail: 'Desk job, little movement beyond daily life' },
  { value: 'light', label: 'Lightly active', detail: 'Training one to three days a week' },
  { value: 'moderate', label: 'Moderately active', detail: 'Training three to five days a week' },
  { value: 'active', label: 'Active', detail: 'Training six or seven days a week' },
  { value: 'very_active', label: 'Very active', detail: 'Physical job, or training twice a day' },
];

export const GOAL_CHOICES: Choice<Goal>[] = [
  { value: 'lose', label: 'Lose fat', detail: 'About half a kilo a week' },
  { value: 'maintain', label: 'Maintain', detail: 'Hold weight, train for strength' },
  { value: 'gain', label: 'Build muscle', detail: 'A small surplus, to limit fat gained with it' },
];

const SEX_LABELS: Record<BiologicalSex, string> = { male: 'Male', female: 'Female' };

function labelOf<T>(choices: Choice<T>[], value: T): string {
  return choices.find((choice) => choice.value === value)?.label ?? '—';
}

export function activityLabel(activity: ActivityLevel): string {
  return labelOf(ACTIVITY_CHOICES, activity);
}

export function goalLabel(goal: Goal): string {
  return labelOf(GOAL_CHOICES, goal);
}

export function sexLabel(sex: BiologicalSex): string {
  return SEX_LABELS[sex];
}
