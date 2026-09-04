/**
 * Moves one item to a new index, returning a new array. Out-of-range moves return the
 * list unchanged rather than throwing — the caller is a button press at a list edge,
 * where "nothing happens" is the correct behaviour.
 */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items;
  if (from < 0 || from >= items.length) return items;
  if (to < 0 || to >= items.length) return items;

  const reordered = [...items];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);
  return reordered;
}
