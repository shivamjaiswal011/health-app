import ReorderableList, {
  reorderItems,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';
import { Text, View } from 'react-native';

import type { RepRange } from '@/domain/training/challenge';
import { resolveRepRange } from '@/domain/training/rep-ranges';
import { useChallengeConfig } from '@/features/challenge/use-challenge-config';
import { EmptyState } from '@/ui/empty-state';
import { announceFailure } from '@/ui/failure';

import type { RoutineExerciseEntry } from '../queries';
import {
  removeRoutineExercise,
  reorderRoutineExercises,
  setRepRange,
  setTargetSets,
} from '../repository';
import { RoutineExerciseRow } from './routine-exercise-row';

const MINIMUM_TARGET_SETS = 1;

/**
 * Mirrors the row's columns exactly — same gap and widths — so the headings sit over
 * the controls they describe rather than near them.
 */
function ColumnHeadings({ showReps }: { showReps: boolean }) {
  return (
    <View className="flex-row items-center gap-3 bg-surface-raised pb-1.5 pl-3 pr-2 pt-3">
      <View className="w-7" />
      <Text className="flex-1 text-[13px] font-medium text-content-faint">Exercise</Text>
      {showReps ? (
        <Text className="w-[86px] text-center text-[13px] font-medium text-content-faint">
          Reps
        </Text>
      ) : null}
      <Text className="w-14 text-center text-[13px] font-medium text-content-faint">Sets</Text>
      <View className="w-9" />
    </View>
  );
}

/** Owns the routine's exercise mutations so the list stays a composition. */
function useRoutineExerciseActions(rows: RoutineExerciseEntry[]) {
  function handleReorder({ from, to }: ReorderableListReorderEvent) {
    const reordered = reorderItems(rows, from, to);
    reorderRoutineExercises(reordered.map((row) => row.id)).catch((cause) =>
      announceFailure('Reordering the routine', cause),
    );
  }

  function handleTargetSets(entryId: string, target: number | null) {
    const sets = Math.max(MINIMUM_TARGET_SETS, target ?? MINIMUM_TARGET_SETS);
    setTargetSets(entryId, sets).catch((cause) => announceFailure('Setting the target', cause));
  }

  /**
   * An edit touches one end of the range, so the other is read back from the row. A
   * half-set range is stored complete — the ladder needs both ends to know when the
   * weight should go up.
   */
  function handleRepRange(
    entry: RoutineExerciseEntry,
    edit: Partial<RepRange>,
    configured: RepRange | null,
  ) {
    const pinned = {
      low: edit.low ?? entry.targetRepsLow ?? undefined,
      high: edit.high ?? entry.targetRepsHigh ?? undefined,
    };
    const range = resolveRepRange({ pinned, muscle: entry.primaryMuscle, configured });
    setRepRange(entry.id, range).catch((cause) => announceFailure('Setting the rep range', cause));
  }

  function handleRemove(entryId: string) {
    removeRoutineExercise(entryId).catch((cause) =>
      announceFailure('Removing the exercise', cause),
    );
  }

  return { handleReorder, handleTargetSets, handleRepRange, handleRemove };
}

export function RoutineExerciseList({ rows }: { rows: RoutineExerciseEntry[] }) {
  const { enabled, settings } = useChallengeConfig();
  const { handleReorder, handleTargetSets, handleRepRange, handleRemove } =
    useRoutineExerciseActions(rows);

  /** What this exercise would ladder through if the lifter pinned nothing on it. */
  const defaultFor = (entry: RoutineExerciseEntry) =>
    resolveRepRange({ pinned: {}, muscle: entry.primaryMuscle, configured: settings.defaultRange });

  if (rows.length === 0) {
    return (
      <View className="px-5">
        <EmptyState
          title="No exercises yet"
          message="Add the lifts you want this routine to open with."
        />
      </View>
    );
  }

  return (
    <View className="mx-5 overflow-hidden rounded-2xl">
      <ColumnHeadings showReps={enabled} />
      <ReorderableList
        data={rows}
        keyExtractor={(entry) => entry.id}
        onReorder={handleReorder}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <RoutineExerciseRow
            entry={item}
            isLast={index === rows.length - 1}
            onChangeTargetSets={(target) => handleTargetSets(item.id, target)}
            onChangeRepRange={(edit) => handleRepRange(item, edit, settings.defaultRange)}
            onRemove={() => handleRemove(item.id)}
            defaultRange={enabled ? defaultFor(item) : null}
          />
        )}
      />
    </View>
  );
}
