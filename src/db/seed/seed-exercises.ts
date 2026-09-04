import { database } from '../client';
import { exercises } from '../schema';
import { catalogueId } from './catalogue-id';
import { EXERCISE_CATALOGUE, type ExerciseSeed } from './exercises';

function toExerciseRow(seed: ExerciseSeed) {
  const now = new Date();
  return {
    id: catalogueId(seed.name),
    createdAt: now,
    updatedAt: now,
    name: seed.name,
    primaryMuscle: seed.primaryMuscle,
    secondaryMuscles: seed.secondaryMuscles,
    equipment: seed.equipment,
    trackingMode: seed.trackingMode,
    isCustom: false,
  };
}

/**
 * Upserts the built-in catalogue. Runs on every launch rather than only on first
 * install: ids are deterministic, so conflicts are skipped, and a later app version
 * that adds exercises picks them up without a bespoke migration.
 *
 * An exercise the user soft-deleted stays deleted — the conflicting row is left alone.
 */
export async function seedExerciseCatalogue(): Promise<void> {
  await database
    .insert(exercises)
    .values(EXERCISE_CATALOGUE.map(toExerciseRow))
    .onConflictDoNothing({ target: exercises.id });
}
