import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { newId } from '@/db/id';
import { announceFailure } from '@/ui/failure';

import { addSet, completeSet, removeSet, uncompleteSet, type SetValues } from '../repository';
import { useRestTimer } from '../rest-timer';
import { usePreviousPerformance } from '../use-previous-performance';
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

function ColumnHeadings() {
  return (
    <View className="flex-row items-center gap-2 px-4 pb-1">
      <Text className="w-6 text-center text-[11px] uppercase text-content-faint">Set</Text>
      <Text className="w-24 text-center text-[11px] uppercase text-content-faint">Previous</Text>
      <Text className="flex-1 text-center text-[11px] uppercase text-content-faint">kg</Text>
      <Text className="flex-1 text-center text-[11px] uppercase text-content-faint">Reps</Text>
      <View className="w-11" />
    </View>
  );
}

export function ExerciseBlock({ entry, workoutId, sets }: ExerciseBlockProps) {
  const previous = usePreviousPerformance(entry.exerciseId, workoutId);
  const startRest = useRestTimer((state) => state.startRest);
  const restSeconds = useRestTimer((state) => state.durationSeconds);

  function handleAddSet() {
    const set = {
      id: newId(),
      workoutExerciseId: entry.id,
      exerciseId: entry.exerciseId,
      position: sets.length,
      setType: 'working' as const,
    };
    addSet(set).catch((cause) => announceFailure('Adding a set', cause));
  }

  function handleComplete(setId: string, values: SetValues) {
    completeSet(setId, values).catch((cause) => announceFailure('Saving the set', cause));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    startRest(restSeconds);
  }

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-line bg-surface-raised">
      <Text className="px-4 pb-2 pt-3 text-base font-semibold text-content">{entry.name}</Text>
      <ColumnHeadings />
      {sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          previous={previous[set.position]}
          onComplete={(values) => handleComplete(set.id, values)}
          onUncomplete={() =>
            uncompleteSet(set.id).catch((cause) => announceFailure('Reopening the set', cause))
          }
          onRemove={() =>
            removeSet(set.id).catch((cause) => announceFailure('Removing the set', cause))
          }
        />
      ))}
      <Pressable onPress={handleAddSet} className="items-center py-3 active:opacity-60">
        <Text className="text-sm font-semibold text-accent">+ Add set</Text>
      </Pressable>
    </View>
  );
}
