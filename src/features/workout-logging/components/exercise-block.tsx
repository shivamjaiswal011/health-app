import * as Haptics from 'expo-haptics';
import { Alert, Pressable, Text, View } from 'react-native';

import { newId } from '@/db/id';
import { prefillFromPrevious } from '@/domain/training/prefill';
import { displayUnit } from '@/features/settings/units';
import { announceFailure } from '@/ui/failure';
import { IconButton } from '@/ui/icon-button';

import {
  addSet,
  completeSet,
  removeSet,
  removeWorkoutExercise,
  uncompleteSet,
  updateSetValues,
  type SetValues,
} from '../repository';
import { useRestTimer } from '../rest-timer';
import { usePreviousPerformance } from '../use-previous-performance';
import type { PreviousSet } from '../queries';
import { SetRow, type LoggedSet } from './set-row';

export type WorkoutExerciseEntry = {
  id: string;
  exerciseId: string;
  name: string;
};

type ExerciseBlockProps = {
  entry: WorkoutExerciseEntry;
  workoutId: string;
  sets: LoggedSet[];
};

function confirmRemoveExercise(entry: WorkoutExerciseEntry) {
  Alert.alert(`Remove ${entry.name}?`, 'Its sets in this workout are removed with it.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Remove',
      style: 'destructive',
      onPress: () => {
        removeWorkoutExercise(entry.id).catch((cause) =>
          announceFailure('Removing the exercise', cause),
        );
      },
    },
  ]);
}

function BlockHeader({ entry }: { entry: WorkoutExerciseEntry }) {
  return (
    <View className="flex-row items-center justify-between px-4 pb-1 pt-3">
      <Text className="flex-1 text-[17px] font-semibold text-content">{entry.name}</Text>
      <IconButton
        name="ellipsis-horizontal"
        label={`Remove ${entry.name}`}
        onPress={() => confirmRemoveExercise(entry)}
      />
    </View>
  );
}

function ColumnHeadings() {
  return (
    <View className="flex-row items-center gap-2 px-4 pb-1.5">
      <Text className="w-6 text-center text-[12px] font-medium text-content-faint">Set</Text>
      <Text className="w-24 text-center text-[12px] font-medium text-content-faint">Previous</Text>
      <Text className="flex-1 text-center text-[12px] font-medium text-content-faint">Weight</Text>
      <Text className="flex-1 text-center text-[12px] font-medium text-content-faint">Reps</Text>
      <View className="w-11" />
    </View>
  );
}

function useSetActions(entry: WorkoutExerciseEntry, previous: PreviousSet[], setCount: number) {
  const startRest = useRestTimer((state) => state.startRest);
  const restSeconds = useRestTimer((state) => state.durationSeconds);

  function handleAddSet() {
    // A set added by hand opens the same way a planned one does: with what was lifted
    // in this slot last time, if there was one. The matching set is renumbered to the
    // first slot because the prefill is asked for a single set, which it fills from
    // position zero.
    const [opening] = prefillFromPrevious(
      1,
      previous.filter((set) => set.position === setCount).map((set) => ({ ...set, position: 0 })),
      displayUnit(),
    );
    addSet({
      id: newId(),
      workoutExerciseId: entry.id,
      exerciseId: entry.exerciseId,
      position: setCount,
      setType: 'working' as const,
      weightKg: opening?.weightKg ?? null,
      weightUnit: opening?.weightUnit,
      reps: opening?.reps ?? null,
    }).catch((cause) => announceFailure('Adding a set', cause));
  }

  function handleComplete(setId: string, values: SetValues) {
    completeSet(setId, values).catch((cause) => announceFailure('Saving the set', cause));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    startRest(restSeconds);
  }

  return { handleAddSet, handleComplete };
}

export function ExerciseBlock({ entry, workoutId, sets }: ExerciseBlockProps) {
  const previous = usePreviousPerformance(entry.exerciseId, workoutId);
  const { handleAddSet, handleComplete } = useSetActions(entry, previous, sets.length);

  return (
    <View className="mb-4 overflow-hidden rounded-2xl bg-surface-raised">
      <BlockHeader entry={entry} />
      <ColumnHeadings />
      {sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          exerciseName={entry.name}
          previous={previous[set.position]}
          onComplete={(values) => handleComplete(set.id, values)}
          onUncomplete={() =>
            uncompleteSet(set.id).catch((cause) => announceFailure('Reopening the set', cause))
          }
          onEdit={(values) =>
            updateSetValues(set.id, values).catch((cause) =>
              announceFailure('Saving the correction', cause),
            )
          }
          onRemove={() =>
            removeSet(set.id).catch((cause) => announceFailure('Removing the set', cause))
          }
        />
      ))}
      <Pressable onPress={handleAddSet} className="items-center py-3.5 active:opacity-60">
        <Text className="text-[15px] font-semibold text-accent">+ Add set</Text>
      </Pressable>
    </View>
  );
}
