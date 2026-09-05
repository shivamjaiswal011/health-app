import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { ActivityLevel, BiologicalSex, Goal } from '@/domain/profile/energy';
import { macrosForProfile } from '@/domain/profile/macros-from-goal';
import { today } from '@/domain/nutrition/calendar-day';
import {
  AboutStep,
  ActivityStep,
  GoalStep,
  TargetsStep,
  WelcomeStep,
} from '@/features/onboarding/components/step-bodies';
import {
  EMPTY_DRAFT,
  isStepComplete,
  nextStep,
  previousStep,
  type OnboardingDraft,
  type OnboardingStep,
} from '@/features/onboarding/steps';
import { rememberOnboardingDismissed } from '@/features/onboarding/first-run';
import { completeOnboarding } from '@/features/profile/repository';
import { Button } from '@/ui/button';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

const TITLES: Record<OnboardingStep, string> = {
  welcome: 'OneHealth',
  about: 'About you',
  activity: 'How active are you?',
  goal: 'What are you after?',
  targets: 'Your starting targets',
};

function StepBody({
  step,
  draft,
  update,
}: {
  step: OnboardingStep;
  draft: OnboardingDraft;
  update: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
}) {
  if (step === 'welcome') return <WelcomeStep />;
  if (step === 'about') return <AboutStep draft={draft} update={update} />;
  if (step === 'activity') return <ActivityStep draft={draft} update={update} />;
  if (step === 'goal') return <GoalStep draft={draft} update={update} />;
  return <TargetsStep draft={draft} />;
}

function finish(draft: OnboardingDraft) {
  const profile = {
    sex: draft.sex as BiologicalSex,
    ageYears: draft.ageYears as number,
    heightCm: draft.heightCm as number,
    activity: draft.activity as ActivityLevel,
    goal: draft.goal as Goal,
  };

  return completeOnboarding({
    profile: { ...profile, effectiveFrom: today() },
    weightKg: draft.weightKg as number,
    targets: macrosForProfile({ ...profile, weightKg: draft.weightKg as number }),
  });
}

export default function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);

  function update<K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function leave() {
    rememberOnboardingDismissed();
    router.replace('/');
  }

  function goBack() {
    const earlier = previousStep(step);
    if (earlier) setStep(earlier);
    else leave();
  }

  function goOn() {
    const later = nextStep(step);
    if (later) return setStep(later);
    finish(draft)
      .then(() => router.replace('/'))
      .catch((cause) => announceFailure('Saving your details', cause));
  }

  const canContinue = isStepComplete(step, draft);

  return (
    <Screen>
      <ScreenHeader
        left={{ label: 'Back', onPress: goBack, tone: 'muted' }}
        right={{ label: 'Skip', onPress: leave, tone: 'muted' }}
      />
      <Text className="px-5 pb-4 text-3xl font-bold text-content">{TITLES[step]}</Text>
      <ScrollView contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
        <StepBody step={step} draft={draft} update={update} />
      </ScrollView>
      <View className="gap-2 px-5 pb-6">
        <Button
          label={step === 'targets' ? 'Start logging' : 'Continue'}
          onPress={goOn}
          disabled={!canContinue}
        />
        {step === 'welcome' ? (
          <Pressable onPress={leave} className="items-center py-2">
            <Text className="text-sm text-content-faint">I will set this up later</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}
