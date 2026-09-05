import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { today } from '@/domain/nutrition/calendar-day';
import { maintenanceEnergy, type Profile } from '@/domain/profile/energy';
import { targetForDayQuery } from '@/features/diet/queries';

import { latestWeighInQuery, profileForDayQuery } from './repository';

/**
 * Who the user told the app they are, what they currently weigh, and the targets that
 * came out of both.
 *
 * The day is fixed at mount rather than read during render: profile and targets are
 * both effective-dated, so a moving day would rebuild the query objects every render
 * and the live subscriptions would never settle.
 */
export function useProfileOverview() {
  const [day] = useState(today);
  const profile = useLiveQuery(profileForDayQuery(day), [day]);
  const weighIn = useLiveQuery(latestWeighInQuery());
  const target = useLiveQuery(targetForDayQuery(day), [day]);

  const details = profile.data[0];
  const weightKg = weighIn.data[0]?.weightKg ?? null;
  const complete: Profile | null = details && weightKg !== null ? { ...details, weightKg } : null;

  return {
    details,
    weightKg,
    targets: target.data[0] ?? null,
    /** Null until there is a weigh-in, since the estimate needs a bodyweight. */
    maintenanceKcal: complete ? Math.round(maintenanceEnergy(complete)) : null,
  };
}
