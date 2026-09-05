import { describe, expect, it } from 'vitest';

import { groupSetsByExercise } from './group-sets';

function set(id: string, workoutExerciseId: string, position: number) {
  return {
    id,
    workoutExerciseId,
    position,
    weightKg: null,
    weightUnit: 'kg' as const,
    setType: 'working' as const,
    reps: null,
    completedAt: null,
  };
}

describe('groupSetsByExercise', () => {
  it('collects sets under their own exercise', () => {
    const grouped = groupSetsByExercise([
      set('a', 'squat-entry', 0),
      set('b', 'bench-entry', 0),
      set('c', 'squat-entry', 1),
    ]);

    expect(grouped.get('squat-entry')?.map((row) => row.id)).toEqual(['a', 'c']);
    expect(grouped.get('bench-entry')?.map((row) => row.id)).toEqual(['b']);
  });

  it('preserves the order rows arrived in', () => {
    const grouped = groupSetsByExercise([
      set('third', 'entry', 2),
      set('first', 'entry', 0),
      set('second', 'entry', 1),
    ]);

    expect(grouped.get('entry')?.map((row) => row.id)).toEqual(['third', 'first', 'second']);
  });

  it('returns nothing for an exercise with no sets', () => {
    expect(groupSetsByExercise([]).get('entry')).toBeUndefined();
  });
});
