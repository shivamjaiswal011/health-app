import { describeChange, MILLISECONDS_PER_DAY } from '@/domain/progress/time-series';

import type { Insight, InsightContext, InsightRule, LiftHistory } from './types';

const SESSIONS_BEFORE_STAGNANT = 4;
const WEEKS_OF_DECLINE = 3;
const DAYS_UNTIL_NEGLECTED = 10;
const RECENT_PR_DAYS = 7;
const PUSH_PULL_BALANCED_LOW = 0.7;
const PUSH_PULL_BALANCED_HIGH = 1.4;
const PUSH_MUSCLES = ['chest', 'shoulders', 'triceps'];
const PULL_MUSCLES = ['back', 'biceps'];
const MINIMUM_SESSIONS_FOR_PROGRESS = 2;
const ISO_DATE_LENGTH = 10;

function bestOf(sessions: LiftHistory['sessions']): number {
  return Math.max(...sessions.map((session) => session.value));
}

/**
 * A lift whose best estimate has not moved in several sessions. Reported for the lift
 * with the longest such run rather than all of them, because four stagnation cards at
 * once is noise the user will dismiss wholesale.
 */
export const stagnantLift: InsightRule = (context) => {
  let worst: { lift: LiftHistory; sessions: number } | null = null;

  for (const lift of context.lifts) {
    if (lift.sessions.length < SESSIONS_BEFORE_STAGNANT) continue;
    const peak = bestOf(lift.sessions);
    const sincePeak = lift.sessions.length - 1 - lift.sessions.findIndex((s) => s.value === peak);
    if (sincePeak < SESSIONS_BEFORE_STAGNANT) continue;
    if (!worst || sincePeak > worst.sessions) worst = { lift, sessions: sincePeak };
  }

  if (!worst) return null;
  return {
    id: `stagnant:${worst.lift.exerciseId}`,
    title: `${worst.lift.name} has stalled`,
    evidence: `No new best in ${worst.sessions} sessions, still ${Math.round(bestOf(worst.lift.sessions))} kg estimated. A lighter week or a different rep range often restarts it.`,
    tone: 'attention',
  };
};

/** Weekly set count falling several weeks running — usually life, not a plan. */
export const decliningVolume: InsightRule = (context) => {
  const recent = context.weeks.slice(-(WEEKS_OF_DECLINE + 1));
  if (recent.length < WEEKS_OF_DECLINE + 1) return null;

  const falling = recent.every(
    (week, index) => index === 0 || week.sets < recent[index - 1].sets,
  );
  if (!falling) return null;

  return {
    id: 'volume-declining',
    title: 'Training volume is drifting down',
    evidence: `Weekly sets have fallen ${WEEKS_OF_DECLINE} weeks running, from ${recent[0].sets} to ${recent[recent.length - 1].sets}.`,
    tone: 'attention',
  };
};

function totalSets(context: InsightContext, muscles: string[]): number {
  return context.muscles
    .filter((entry) => muscles.includes(entry.muscle))
    .reduce((running, entry) => running + entry.setsLast14Days, 0);
}

/** Pushing far more than pulling, or the reverse, over the last fortnight. */
export const pushPullImbalance: InsightRule = (context) => {
  const push = totalSets(context, PUSH_MUSCLES);
  const pull = totalSets(context, PULL_MUSCLES);
  if (push === 0 || pull === 0) return null;

  const ratio = push / pull;
  if (ratio >= PUSH_PULL_BALANCED_LOW && ratio <= PUSH_PULL_BALANCED_HIGH) return null;

  const heavier = ratio > PUSH_PULL_BALANCED_HIGH ? 'pushing' : 'pulling';
  const lighter = ratio > PUSH_PULL_BALANCED_HIGH ? 'pulling' : 'pushing';
  return {
    id: 'push-pull-imbalance',
    title: `More ${heavier} than ${lighter}`,
    evidence: `${push} push sets against ${pull} pull sets in the last fortnight. Long-term imbalance tends to show up in the shoulders.`,
    tone: 'neutral',
  };
};

function daysSince(day: string, today: string): number {
  const gap = new Date(today).getTime() - new Date(day).getTime();
  return Math.floor(gap / MILLISECONDS_PER_DAY);
}

/** A muscle group trained before, but not lately. */
export const neglectedMuscle: InsightRule = (context) => {
  const stale = context.muscles
    .filter((entry) => entry.lastTrainedOn !== null)
    .map((entry) => ({ entry, days: daysSince(entry.lastTrainedOn as string, context.today) }))
    .filter((candidate) => candidate.days >= DAYS_UNTIL_NEGLECTED)
    .sort((left, right) => right.days - left.days);

  const longest = stale[0];
  if (!longest) return null;

  return {
    id: `neglected:${longest.entry.muscle}`,
    title: `${longest.entry.muscle.replace('_', ' ')} untrained for ${longest.days} days`,
    evidence: `Last direct work was ${longest.days} days ago. Everything else has been trained since.`,
    tone: 'neutral',
  };
};

/** Something to be pleased about, when there is something to be pleased about. */
export const recentProgress: InsightRule = (context) => {
  for (const lift of context.lifts) {
    if (lift.sessions.length < MINIMUM_SESSIONS_FOR_PROGRESS) continue;
    const latest = lift.sessions[lift.sessions.length - 1];
    if (daysSince(new Date(latest.at).toISOString().slice(0, ISO_DATE_LENGTH), context.today) > RECENT_PR_DAYS) {
      continue;
    }
    if (latest.value < bestOf(lift.sessions)) continue;

    const change = describeChange(lift.sessions);
    if (!change || change.delta <= 0) continue;

    return {
      id: `progress:${lift.exerciseId}`,
      title: `${lift.name} is at its best`,
      evidence: `${Math.round(latest.value)} kg estimated, up ${Math.round(change.delta)} kg since you started tracking it.`,
      tone: 'positive',
    } satisfies Insight;
  }
  return null;
};
