import { useState } from 'react';

import type { RepRange } from '@/domain/training/challenge';
import {
  challengeEnabled,
  challengeSettings,
  setBackoffSets,
  setChallengeEnabled,
  setDefaultRepRange,
  clearDefaultRepRange,
} from '@/features/settings/challenge';

/**
 * Challenge mode's configuration, kept in React state alongside the device store.
 *
 * The preference store is not reactive, so a screen that read it directly would show
 * the old value until it happened to remount. Mirroring it here is what makes a toggle
 * respond to its own tap.
 */
export function useChallengeConfig() {
  const [enabled, setEnabled] = useState(challengeEnabled);
  const [settings, setSettings] = useState(challengeSettings);

  function toggleEnabled(next: boolean) {
    setChallengeEnabled(next);
    setEnabled(next);
  }

  function toggleBackoff(next: boolean) {
    setBackoffSets(next);
    setSettings({ ...settings, backoffSets: next });
  }

  /** Null hands every exercise back to its muscle's own default. */
  function chooseRange(range: RepRange | null) {
    if (range) setDefaultRepRange(range);
    else clearDefaultRepRange();
    setSettings({ ...settings, defaultRange: range });
  }

  return { enabled, settings, toggleEnabled, toggleBackoff, chooseRange };
}
