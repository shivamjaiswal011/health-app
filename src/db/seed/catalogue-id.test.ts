import { describe, expect, it } from 'vitest';

import { catalogueId, isCatalogueId } from './catalogue-id';
import { EXERCISE_CATALOGUE } from './exercises';

describe('catalogueId', () => {
  it('is stable for the same name', () => {
    expect(catalogueId('Bench Press (Barbell)')).toBe(catalogueId('Bench Press (Barbell)'));
  });

  it('slugifies punctuation and spacing', () => {
    expect(catalogueId('Bench Press (Barbell)')).toBe('catalogue:bench-press-barbell');
  });

  it('does not leave trailing separators', () => {
    expect(catalogueId('T-Bar Row')).toBe('catalogue:t-bar-row');
  });

  it('marks its own output as a catalogue id', () => {
    expect(isCatalogueId(catalogueId('Pull Up'))).toBe(true);
  });

  it('does not mistake a UUID for a catalogue id', () => {
    expect(isCatalogueId('01936f2a-7c3d-7000-8000-000000000000')).toBe(false);
  });
});

describe('EXERCISE_CATALOGUE', () => {
  it('generates a unique id for every entry', () => {
    const ids = EXERCISE_CATALOGUE.map((exercise) => catalogueId(exercise.name));
    expect(new Set(ids).size).toBe(EXERCISE_CATALOGUE.length);
  });

  it('has no duplicate names', () => {
    const names = EXERCISE_CATALOGUE.map((exercise) => exercise.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('never lists a muscle as both primary and secondary', () => {
    const overlapping = EXERCISE_CATALOGUE.filter((exercise) =>
      exercise.secondaryMuscles.includes(exercise.primaryMuscle),
    );
    expect(overlapping.map((exercise) => exercise.name)).toEqual([]);
  });
});
