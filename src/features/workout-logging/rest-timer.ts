import { create } from 'zustand';

export const DEFAULT_REST_SECONDS = 120;
export const MILLISECONDS_PER_SECOND = 1000;

type RestTimerState = {
  /** Epoch milliseconds at which rest ends, or null when no timer is running. */
  endsAt: number | null;
  durationSeconds: number;
  startRest: (seconds: number) => void;
  stopRest: () => void;
};

/**
 * The only client-side state in the logger. Everything else — the workout, its
 * exercises, its sets — lives in SQLite and reaches the UI through live queries,
 * so there is nothing to reconcile after a crash.
 *
 * Stored as an end timestamp rather than a ticking counter so the remaining time
 * stays correct across backgrounding, where timers stop firing.
 */
export const useRestTimer = create<RestTimerState>((set) => ({
  endsAt: null,
  durationSeconds: DEFAULT_REST_SECONDS,
  startRest: (seconds) =>
    set({
      endsAt: Date.now() + seconds * MILLISECONDS_PER_SECOND,
      durationSeconds: seconds,
    }),
  stopRest: () => set({ endsAt: null }),
}));
