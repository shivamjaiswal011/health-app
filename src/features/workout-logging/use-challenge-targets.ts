import { useEffect, useState } from 'react';

import { nextChallenge, type ChallengeTarget, type RepRange } from '@/domain/training/challenge';
import { challengeEnabled, challengeSettings } from '@/features/settings/challenge';
import { loadRoutineRepRanges } from '@/features/routines/queries';
import { displayUnit } from '@/features/settings/units';
import { reportFailure } from '@/ui/failure';

import type { PreviousSet } from './queries';

/** Looks up the target for one exercise, or null when challenge mode is not in play. */
export type ChallengeTargetLookup = (
  exerciseId: string,
  previous: PreviousSet[],
) => ChallengeTarget | null;

const NO_TARGETS: ChallengeTargetLookup = () => null;

function completeRange(pinned: Partial<RepRange>, fallback: RepRange): RepRange {
  const low = pinned.low ?? fallback.low;
  const high = pinned.high ?? fallback.high;
  return high >= low ? { low, high } : fallback;
}

/**
 * What each exercise is being asked for this session.
 *
 * Re-derived from last session rather than read off the opened rows, so the badge says
 * the same thing after the lifter has typed into them — a target that drifted as the
 * set was logged would be a scoreboard of itself.
 */
export function useChallengeTargets(workoutId: string): ChallengeTargetLookup {
  const [ranges, setRanges] = useState<Map<string, Partial<RepRange>> | null>(null);

  useEffect(() => {
    let abandoned = false;
    if (!challengeEnabled()) return;

    loadRoutineRepRanges(workoutId)
      .then((loaded) => {
        if (!abandoned) setRanges(loaded);
      })
      .catch((cause) => reportFailure('Loading challenge targets', cause));

    return () => {
      abandoned = true;
    };
  }, [workoutId]);

  if (ranges === null) return NO_TARGETS;

  const { defaultRange } = challengeSettings();
  return (exerciseId, previous) => {
    // Only the exercises the routine planned carry a target. An exercise added to the
    // session by hand was opened from history, not from the ladder, and claiming a
    // level for it would announce a target nothing actually set.
    const pinned = ranges.get(exerciseId);
    if (!pinned) return null;
    return nextChallenge(completeRange(pinned, defaultRange), previous, displayUnit());
  };
}
