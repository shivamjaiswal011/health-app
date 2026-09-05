import { describe, expect, it } from 'vitest';

import { EMPTY_DRAFT, isStepComplete, nextStep, previousStep } from './steps';

const FILLED = {
  sex: 'male' as const,
  ageYears: 30,
  heightCm: 178,
  weightKg: 80,
  activity: 'moderate' as const,
  goal: 'lose' as const,
};

describe('isStepComplete', () => {
  it('lets the user past the welcome without answering anything', () => {
    expect(isStepComplete('welcome', EMPTY_DRAFT)).toBe(true);
  });

  it('holds them on "about" until every field is filled', () => {
    expect(isStepComplete('about', EMPTY_DRAFT)).toBe(false);
    expect(isStepComplete('about', { ...FILLED, weightKg: null })).toBe(false);
    expect(isStepComplete('about', FILLED)).toBe(true);
  });

  it('requires an activity level and a goal on their own steps', () => {
    expect(isStepComplete('activity', { ...FILLED, activity: null })).toBe(false);
    expect(isStepComplete('goal', { ...FILLED, goal: null })).toBe(false);
  });
});

describe('step order', () => {
  it('runs welcome through to targets', () => {
    expect(nextStep('welcome')).toBe('about');
    expect(nextStep('goal')).toBe('targets');
  });

  it('stops at the end', () => {
    expect(nextStep('targets')).toBeNull();
  });

  it('goes back, and refuses to go back past the start', () => {
    expect(previousStep('about')).toBe('welcome');
    expect(previousStep('welcome')).toBeNull();
  });
});
