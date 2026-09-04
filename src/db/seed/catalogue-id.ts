const CATALOGUE_ID_PREFIX = 'catalogue:';

/**
 * Catalogue exercises get an id derived from their name rather than a UUID, so every
 * device independently agrees that "Bench Press (Barbell)" is the same exercise. A
 * per-device UUID here would make the same lift look like two once sync exists, and
 * silently split a user's history across them.
 *
 * User-created exercises still get a UUIDv7 — they have no shared definition to agree on.
 */
export function catalogueId(exerciseName: string): string {
  const slug = exerciseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${CATALOGUE_ID_PREFIX}${slug}`;
}

export function isCatalogueId(id: string): boolean {
  return id.startsWith(CATALOGUE_ID_PREFIX);
}
