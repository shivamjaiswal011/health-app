import { and, asc, isNull, like } from 'drizzle-orm';

import { database } from '@/db/client';
import { exercises } from '@/db/schema';

export type CatalogueRow = {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
};

/**
 * Catalogue search. A LIKE scan is right at this size — the catalogue is under a
 * hundred rows. Food search in M4 needs FTS5; this does not.
 */
export function exerciseSearchQuery(term: string) {
  const trimmed = term.trim();
  return database
    .select({
      id: exercises.id,
      name: exercises.name,
      primaryMuscle: exercises.primaryMuscle,
      equipment: exercises.equipment,
    })
    .from(exercises)
    .where(
      and(
        isNull(exercises.deletedAt),
        trimmed.length > 0 ? like(exercises.name, `%${trimmed}%`) : undefined,
      ),
    )
    .orderBy(asc(exercises.name));
}
