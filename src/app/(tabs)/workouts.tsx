import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { newId } from '@/db/id';
import { defaultWorkoutName } from '@/domain/training/workout-name';
import {
  activeWorkoutQuery,
  workoutHistoryQuery,
} from '@/features/workout-logging/queries';
import { startWorkout } from '@/features/workout-logging/repository';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { EmptyState } from '@/ui/empty-state';
import { announceFailure } from '@/ui/failure';
import { Screen } from '@/ui/screen';

type HistoryRow = {
  id: string;
  name: string;
  startedAt: Date;
  endedAt: Date | null;
};

function beginSession() {
  const startedAt = new Date();
  const id = newId();
  startWorkout({ id, name: defaultWorkoutName(startedAt), startedAt })
    .then(() => router.push(`/workout/${id}`))
    .catch((cause) => announceFailure('Starting the workout', cause));
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
  const history = useLiveQuery(workoutHistoryQuery());
  const inProgress = active.data[0];

  return (
    <Screen title="Train">
      <ScrollView contentContainerClassName="px-5 pb-8">
        {inProgress ? (
          <ResumeBanner workoutId={inProgress.id} name={inProgress.name} />
        ) : (
          <View className="mb-4">
            <Button label="Start empty workout" onPress={beginSession} />
          </View>
        )}

        {history.data.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            message="Finished workouts appear here, newest first."
          />
        ) : (
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
