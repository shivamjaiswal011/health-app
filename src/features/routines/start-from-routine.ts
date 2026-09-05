import { planChallengeSets, type RepRange } from '@/domain/training/challenge';
import { resolveRepRange } from '@/domain/training/rep-ranges';
import { prefillFromPrevious, type PlannedSet, type PreviousSet } from '@/domain/training/prefill';
import { loadPreviousPerformance } from '@/features/workout-logging/queries';
import { startPlannedWorkout, type PlannedExercise } from '@/features/workout-logging/repository';

import { loadRoutineExercises, routineQuery } from './queries';

import type { ChallengeSettings } from '@/features/settings/challenge';
import type { WeightUnit } from '@/domain/units/weight';

/**
 * How the lifter has the app configured. Passed in rather than read here so this module
 * stays free of the device preference store, which cannot be loaded outside a device.
 */
export type SessionPreferences = {
  /** Used only for an exercise with no history; otherwise the unit follows the lift. */
  fallbackUnit: WeightUnit;
  /** Null when challenge mode is off, in which case sets open with last session's numbers. */
  challenge: ChallengeSettings | null;
};

/** A routine with no explicit target still opens one row to log into. */
const FALLBACK_TARGET_SETS = 1;

type RoutineEntry = Awaited<ReturnType<typeof loadRoutineExercises>>[number];

/** A routine may pin a range per exercise; otherwise the muscle's own default applies. */
function repRangeFor(entry: RoutineEntry, settings: ChallengeSettings): RepRange {
  return resolveRepRange({
    pinned: { low: entry.targetRepsLow ?? undefined, high: entry.targetRepsHigh ?? undefined },
    muscle: entry.primaryMuscle,
    configured: settings.defaultRange,
  });
}

type ExercisePlanRequest = {
  entry: RoutineEntry;
  workoutId: string;
  preferences: SessionPreferences;
};

type ExerciseOpening = {
  entry: RoutineEntry;
  previous: PreviousSet[];
  preferences: SessionPreferences;
};

/** The ladder's version of the opening rows: every working set at the target to beat. */
function challengeSets(opening: ExerciseOpening, settings: ChallengeSettings): PlannedSet[] {
  return planChallengeSets({
    range: repRangeFor(opening.entry, settings),
    performed: opening.previous,
    setCount: opening.entry.targetSets ?? FALLBACK_TARGET_SETS,
    equipment: opening.entry.equipment,
    fallbackUnit: opening.preferences.fallbackUnit,
    includeBackoff: settings.backoffSets,
  }).sets;
}

/** Challenge mode off: the rows open with whatever was lifted in them last time. */
function repeatedSets(opening: ExerciseOpening): PlannedSet[] {
  return prefillFromPrevious(
    opening.entry.targetSets ?? FALLBACK_TARGET_SETS,
    opening.previous,
    opening.preferences.fallbackUnit,
  );
}

/**
 * Builds the session's opening state: the routine says how many sets, and either the
 * lifter's own last session or the challenge ladder says what to put in them.
 *
 * History is looked up per exercise rather than per routine, so the numbers follow the
 * lift even if it was last trained in a different routine or an ad-hoc session — which
 * is what a lifter means by "what did I do last time".
 */
async function planExercise(request: ExercisePlanRequest): Promise<PlannedExercise> {
  const { entry, workoutId, preferences } = request;
  const previous = await loadPreviousPerformance(entry.exerciseId, workoutId);
  const opening: ExerciseOpening = { entry, previous, preferences };

  const sets = preferences.challenge
    ? challengeSets(opening, preferences.challenge)
    : repeatedSets(opening);

  return { exerciseId: entry.exerciseId, sets };
}

/**
 * Begins a session from a saved routine. The workout keeps a reference to the routine
 * it came from, but copies the exercises rather than pointing at them — editing the
 * routine afterwards must not rewrite a session already performed.
 */
export async function startWorkoutFromRoutine(
  routineId: string,
  workoutId: string,
  preferences: SessionPreferences,
): Promise<void> {
  const [routine] = await routineQuery(routineId);
  if (!routine) throw new Error(`Routine ${routineId} no longer exists`);

  const entries = await loadRoutineExercises(routineId);
  const plan = await Promise.all(
    entries.map((entry) => planExercise({ entry, workoutId, preferences })),
  );

  await startPlannedWorkout(
    { id: workoutId, name: routine.name, startedAt: new Date(), routineId },
    plan,
  );
}
