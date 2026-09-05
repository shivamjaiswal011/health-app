import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { evaluateInsights } from '@/domain/insights/evaluate';
import type { Insight } from '@/domain/insights/types';
import { today } from '@/domain/nutrition/calendar-day';
import { MILLISECONDS_PER_DAY } from '@/domain/progress/time-series';
import { targetForDayQuery } from '@/features/diet/queries';
import {
  bodyWeightQuery,
  dailyEnergyQuery,
  recentCompletedSetsQuery,
  weeklyVolumeQuery,
} from '@/features/progress/queries';

import { displayUnit } from '@/features/settings/units';

import { buildInsightContext } from './build-context';

const HISTORY_DAYS = 180;

/**
 * Evaluated on every render of the dashboard rather than cached. The rules are pure
 * arithmetic over a few hundred rows, and a cached insight that contradicts the numbers
 * on the same screen is worse than one recomputed needlessly.
 */
export function useInsights(): Insight[] {
  // Fixed at mount rather than read during render: a window that moved every render
  // would be impure, and would rebuild the query object each time so the live
  // subscription never settled.
  const [day] = useState(today);
  const [since] = useState(() => new Date(Date.now() - HISTORY_DAYS * MILLISECONDS_PER_DAY));

  const completedSets = useLiveQuery(recentCompletedSetsQuery(since));
  const weeks = useLiveQuery(weeklyVolumeQuery());
  const nutrition = useLiveQuery(dailyEnergyQuery());
  const target = useLiveQuery(targetForDayQuery(day), [day]);
  const weighIns = useLiveQuery(bodyWeightQuery());

  const context = buildInsightContext({
    today: day,
    completedSets: completedSets.data,
    weeks: weeks.data,
    nutrition: nutrition.data,
    target: target.data[0] ?? null,
    weighIns: weighIns.data,
    weightUnit: displayUnit(),
  });

  return evaluateInsights(context);
}
