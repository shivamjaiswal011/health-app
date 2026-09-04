import { uuidv7 } from 'uuidv7';

/**
 * Every user-owned row gets a UUIDv7. It is time-sortable, so inserts stay
 * append-friendly in the index, and it can be generated offline on any device
 * without coordination — which is what makes the future sync merge tractable.
 */
export function newId(): string {
  return uuidv7();
}
