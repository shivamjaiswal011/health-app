import { createMMKV } from 'react-native-mmkv';
import { useEffect, useState } from 'react';

import { hasProfile } from '@/features/profile/repository';
import { reportFailure } from '@/ui/failure';

const DISMISSED_KEY = 'onboarding.dismissed';

/**
 * Per-device, not per-account, and not worth a database row: whether this install has
 * already offered onboarding. Kept in MMKV so skipping is remembered without inventing
 * a settings table for one boolean.
 */
const storage = createMMKV({ id: 'preferences' });

export function rememberOnboardingDismissed(): void {
  storage.set(DISMISSED_KEY, true);
}

function wasDismissed(): boolean {
  try {
    return storage.getBoolean(DISMISSED_KEY) ?? false;
  } catch (cause) {
    // A device that cannot read preferences should still open the app.
    reportFailure('Reading onboarding preference', cause);
    return true;
  }
}

type FirstRunState = 'checking' | 'needs-onboarding' | 'ready';

/**
 * Whether this launch should open onboarding.
 *
 * Offered once. Someone who skips is not asked again — they said no, and an app that
 * keeps asking is one people stop opening. Settings still has everything onboarding
 * would have set.
 */
export function useFirstRun(afterMigrations: boolean): FirstRunState {
  const [state, setState] = useState<FirstRunState>('checking');

  useEffect(() => {
    if (!afterMigrations) return;
    let abandoned = false;

    hasProfile()
      .then((exists) => {
        if (abandoned) return;
        setState(exists || wasDismissed() ? 'ready' : 'needs-onboarding');
      })
      .catch((cause) => {
        reportFailure('Checking for a profile', cause);
        if (!abandoned) setState('ready');
      });

    return () => {
      abandoned = true;
    };
  }, [afterMigrations]);

  return state;
}
