import { EmptyState } from '@/ui/empty-state';
import { announceFailure } from '@/ui/failure';

import type { RoutineExerciseEntry } from '../queries';
import { moveItem } from '../reorder';
import { removeRoutineExercise, reorderRoutineExercises, setTargetSets } from '../repository';
import { RoutineExerciseRow } from './routine-exercise-row';

const MINIMUM_TARGET_SETS = 1;

/** Owns the routine's exercise mutations so the screen stays a composition. */
export function RoutineExerciseList({ rows }: { rows: RoutineExerciseEntry[] }) {
  function handleMove(index: number, direction: -1 | 1) {
    const reordered = moveItem(rows, index, index + direction);
    if (reordered === rows) return;
    reorderRoutineExercises(reordered.map((row) => row.id)).catch((cause) =>
      announceFailure('Reordering the routine', cause),
    );
  }

  function handleTargetSets(entryId: string, target: number | null) {
    const sets = Math.max(MINIMUM_TARGET_SETS, target ?? MINIMUM_TARGET_SETS);
    setTargetSets(entryId, sets).catch((cause) => announceFailure('Setting the target', cause));
  }

  function handleRemove(entryId: string) {
    removeRoutineExercise(entryId).catch((cause) =>
      announceFailure('Removing the exercise', cause),
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No exercises yet"
        message="Add the lifts you want this routine to open with."
      />
    );
  }

  return rows.map((entry, index) => (
    <RoutineExerciseRow
      key={entry.id}
      entry={entry}
      onMove={(direction) => handleMove(index, direction)}
      onChangeTargetSets={(target) => handleTargetSets(entry.id, target)}
      onRemove={() => handleRemove(entry.id)}
    />
  ));
}
