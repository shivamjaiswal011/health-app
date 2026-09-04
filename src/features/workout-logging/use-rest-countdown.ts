import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';

import { MILLISECONDS_PER_SECOND, useRestTimer } from './rest-timer';

const TICK_MILLISECONDS = 250;

function secondsRemaining(endsAt: number | null): number | null {
  if (endsAt === null) return null;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / MILLISECONDS_PER_SECOND));
}

/**
 * Seconds left on the rest timer, or null when none is running.
 *
 * Derived during render from the end timestamp, with the interval only forcing a
 * re-render. Recomputing rather than decrementing means a throttled or dropped
 * interval — which backgrounding guarantees — cannot make the countdown drift.
 */
export function useRestCountdown(): number | null {
  const endsAt = useRestTimer((state) => state.endsAt);
  const stopRest = useRestTimer((state) => state.stopRest);
  const [, advanceTick] = useState(0);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = setInterval(() => advanceTick((count) => count + 1), TICK_MILLISECONDS);
    return () => clearInterval(tick);
  }, [endsAt]);

  const remaining = secondsRemaining(endsAt);
  const hasFinished = remaining !== null && remaining <= 0;

  useEffect(() => {
    if (!hasFinished) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    stopRest();
  }, [hasFinished, stopRest]);

  return remaining;
}
