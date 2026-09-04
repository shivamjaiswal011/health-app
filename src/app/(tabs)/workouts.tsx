import { format } from 'date-fns';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { newId } from '@/db/id';
import { defaultWorkoutName } from '@/domain/training/workout-name';
import { routineListQuery } from '@/features/routines/queries';
import { createRoutine } from '@/features/routines/repository';
import { activeWorkoutQuery, workoutHistoryQuery } from '@/features/workout-logging/queries';
import { startWorkout } from '@/features/workout-logging/repository';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';

type HistoryRow = {
  id: string;
  name: string;
  startedAt: Date;
};

function beginEmptySession() {
  const startedAt = new Date();
  const id = newId();
  startWorkout({ id, name: defaultWorkoutName(startedAt), startedAt })
    .then(() => router.push(`/workout/${id}`))
    .catch((cause) => announceFailure('Starting the workout', cause));
}

function beginNewRoutine(position: number) {
  const id = newId();
  createRoutine({ id, name: 'New Routine', position })
    .then(() => router.push(`/routine/${id}`))
    .catch((cause) => announceFailure('Creating the routine', cause));
}

function ResumeBanner({ workoutId, name }: { workoutId: string; name: string }) {
  return (
    <Pressable
      onPress={() => router.push(`/workout/${workoutId}`)}
      className="mb-4 rounded-2xl bg-accent px-4 py-3 active:opacity-80">
      <Text className="text-xs font-semibold uppercase text-white/80">In progress</Text>
      <Text className="mt-0.5 text-base font-semibold text-white">{name}</Text>
    </Pressable>
  );
}

function RoutineRow({ id, name }: { id: string; name: string }) {
  return (
    <Pressable
      onPress={() => router.push(`/routine/${id}`)}
      className="flex-row items-center justify-between border-b border-line py-3 active:opacity-60">
      <Text className="text-base text-content">{name}</Text>
      <Text className="text-sm text-content-faint">›</Text>
    </Pressable>
  );
}

function HistoryEntry({ workout }: { workout: HistoryRow }) {
  return (
    <View className="border-b border-line py-3">
      <Text className="text-base text-content">{workout.name}</Text>
      <Text className="mt-0.5 text-xs text-content-faint">
        {format(workout.startedAt, 'EEE d MMM · HH:mm')}
      </Text>
    </View>
  );
}

export default function WorkoutsScreen() {
  const active = useLiveQuery(activeWorkoutQuery());
  const routines = useLiveQuery(routineListQuery());
  const history = useLiveQuery(workoutHistoryQuery());
  const inProgress = active.data[0];

  return (
    <Screen title="Train">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8">
        {inProgress ? (
          <ResumeBanner workoutId={inProgress.id} name={inProgress.name} />
        ) : (
          <Button label="Start empty workout" onPress={beginEmptySession} />
        )}

        <Card title="Routines">
          {routines.data.map((routine) => (
            <RoutineRow key={routine.id} id={routine.id} name={routine.name} />
          ))}
          <Pressable
            onPress={() => beginNewRoutine(routines.data.length)}
            className="items-center py-3 active:opacity-60">
            <Text className="text-sm font-semibold text-accent">+ New routine</Text>
          </Pressable>
        </Card>

        {history.data.length > 0 && (
          <Card title="History">
            {history.data.map((workout) => (
              <HistoryEntry key={workout.id} workout={workout} />
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
