import { describe, expect, it } from 'vitest';

import { moveItem } from './reorder';

describe('moveItem', () => {
  it('moves an item later in the list', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an item earlier in the list', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('swaps neighbours', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 0)).toEqual(['b', 'a', 'c']);
  });

  it('leaves the list untouched when moving onto itself', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });

  it.each([
    ['above the top', 0, -1],
    ['below the bottom', 2, 3],
    ['from a position that does not exist', 9, 0],
  ])('ignores a move %s', (_label, from, to) => {
    expect(moveItem(['a', 'b', 'c'], from, to)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the original list', () => {
    const original = ['a', 'b', 'c'];
    moveItem(original, 0, 2);
    expect(original).toEqual(['a', 'b', 'c']);
  });
});
