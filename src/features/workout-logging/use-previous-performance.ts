import { useEffect, useState } from 'react';

import { reportFailure } from '@/ui/failure';

import { loadPreviousPerformance, type PreviousSet } from './queries';

const NONE: PreviousSet[] = [];

/**
 * Last session's sets for this exercise, indexed by position so a row can look up
 * its own ghost. Loaded once per mount: the previous session cannot change while
 * the current one is being logged.
 */
export function usePreviousPerformance(exerciseId: string, workoutId: string): PreviousSet[] {
  const [previous, setPrevious] = useState<PreviousSet[]>(NONE);

  useEffect(() => {
    let abandoned = false;
    loadPreviousPerformance(exerciseId, workoutId)
      .then((loaded) => {
        if (!abandoned) setPrevious(loaded);
      })
      .catch((cause) => {
        reportFailure('Loading previous performance', cause);
        if (!abandoned) setPrevious(NONE);
      });

    return () => {
      abandoned = true;
    };
  }, [exerciseId, workoutId]);

  return previous;
}
