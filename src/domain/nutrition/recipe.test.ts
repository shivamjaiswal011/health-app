import { describe, expect, it } from 'vitest';

import { composeServing, type RecipeIngredient } from './recipe';

function ingredient(grams: number, kcal: number, fiber: number | null = 0): RecipeIngredient {
  return { grams, kcal, protein: 10, carbs: 20, fat: 5, fiber };
}

describe('composeServing', () => {
  it('splits the total across servings', () => {
    const serving = composeServing([ingredient(200, 400), ingredient(200, 400)], 4);

    expect(serving.totalGrams).toBe(400);
    expect(serving.gramsPerServing).toBe(100);
    expect(serving.perServing.kcal).toBe(200);
  });

  it('returns the whole recipe when it is a single serving', () => {
    const serving = composeServing([ingredient(150, 300)], 1);

    expect(serving.perServing.kcal).toBe(300);
    expect(serving.gramsPerServing).toBe(150);
  });

  it('is empty for a recipe with no ingredients', () => {
    expect(composeServing([], 4).perServing.kcal).toBe(0);
  });

  it('refuses to divide by a nonsensical serving count', () => {
    expect(composeServing([ingredient(100, 200)], 0).perServing.kcal).toBe(0);
  });

  it('sums fibre when every ingredient reports it', () => {
    const serving = composeServing([ingredient(100, 200, 3), ingredient(100, 200, 5)], 2);
    expect(serving.perServing.fiber).toBe(4);
  });

  it('leaves fibre unknown when any ingredient does not report it', () => {
    const serving = composeServing([ingredient(100, 200, 3), ingredient(100, 200, null)], 2);
    expect(serving.perServing.fiber).toBeNull();
  });
});
