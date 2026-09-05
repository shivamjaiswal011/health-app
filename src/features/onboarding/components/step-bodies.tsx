import { Text, View } from 'react-native';

import type { ActivityLevel, BiologicalSex, Goal } from '@/domain/profile/energy';
import { macrosForProfile } from '@/domain/profile/macros-from-goal';
import { ACTIVITY_CHOICES, GOAL_CHOICES } from '@/features/profile/labels';

import type { OnboardingDraft } from '../steps';
import { ChoiceGroup } from './choice-group';
import { MeasureField } from './measure-field';

type Update = <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;

export function WelcomeStep() {
  return (
    <View className="gap-3">
      <Text className="text-base leading-6 text-content">
        Log your training and your eating, and see what the two do to each other over time.
      </Text>
      <Text className="text-sm leading-5 text-content-muted">
        Everything stays on this phone. There is no account and no server, nothing is uploaded, and
        the app does not run in the background — so it works in a gym basement and costs nothing in
        battery while it is closed.
      </Text>
      <Text className="text-sm leading-5 text-content-muted">
        The next few questions set your starting targets. You can change any of them later, and skip
        them entirely if you would rather just start logging.
      </Text>
    </View>
  );
}

const SEXES: { value: BiologicalSex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export function AboutStep({ draft, update }: { draft: OnboardingDraft; update: Update }) {
  return (
    <View className="gap-4">
      <Text className="text-sm leading-5 text-content-muted">
        Used once, to estimate how much energy you burn at rest. The formula needs all four.
      </Text>
      <ChoiceGroup
        choices={SEXES}
        selected={draft.sex}
        onSelect={(value) => update('sex', value)}
      />
      <View>
        <MeasureField
          label="Age"
          unit="yrs"
          placeholder="30"
          onChange={(value) => update('ageYears', value)}
        />
        <MeasureField
          label="Height"
          unit="cm"
          placeholder="175"
          onChange={(value) => update('heightCm', value)}
        />
        <MeasureField
          label="Weight"
          unit="kg"
          placeholder="70"
          onChange={(value) => update('weightKg', value)}
        />
      </View>
    </View>
  );
}

export function ActivityStep({ draft, update }: { draft: OnboardingDraft; update: Update }) {
  return (
    <View className="gap-4">
      <Text className="text-sm leading-5 text-content-muted">
        Counting everything you do in a week, not just the gym. Most people overestimate this; if
        you are between two, the lower one is usually closer.
      </Text>
      <ChoiceGroup
        choices={ACTIVITY_CHOICES}
        selected={draft.activity}
        onSelect={(value) => update('activity', value)}
      />
    </View>
  );
}

export function GoalStep({ draft, update }: { draft: OnboardingDraft; update: Update }) {
  return (
    <View className="gap-4">
      <Text className="text-sm leading-5 text-content-muted">
        This sets the size of your calorie target, and lets the app tell you when the scale is going
        the wrong way for what you asked for.
      </Text>
      <ChoiceGroup
        choices={GOAL_CHOICES}
        selected={draft.goal}
        onSelect={(value) => update('goal', value)}
      />
    </View>
  );
}

function TargetRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-line py-3">
      <Text className="text-base text-content">{label}</Text>
      <Text className="text-base font-semibold text-content">{value}</Text>
    </View>
  );
}

/** The draft is complete by the time this renders; the caller gates on that. */
export function TargetsStep({ draft }: { draft: OnboardingDraft }) {
  const targets = macrosForProfile({
    sex: draft.sex as BiologicalSex,
    ageYears: draft.ageYears as number,
    heightCm: draft.heightCm as number,
    weightKg: draft.weightKg as number,
    activity: draft.activity as ActivityLevel,
    goal: draft.goal as Goal,
  });

  return (
    <View className="gap-4">
      <Text className="text-sm leading-5 text-content-muted">
        A starting point, not a prescription. These are population averages — the scale over the
        next few weeks is what tells you whether they were right for you, and the app will say so
        when it can see.
      </Text>
      <View>
        <TargetRow label="Calories" value={`${targets.kcal} kcal`} />
        <TargetRow label="Protein" value={`${targets.proteinGrams} g`} />
        <TargetRow label="Carbs" value={`${targets.carbsGrams} g`} />
        <TargetRow label="Fat" value={`${targets.fatGrams} g`} />
      </View>
      <Text className="text-xs leading-4 text-content-faint">
        Editable any time from Settings, or by tapping the summary on the Diet tab.
      </Text>
    </View>
  );
}
