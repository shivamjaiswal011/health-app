import { format } from 'date-fns';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';

import { newId } from '@/db/id';
import { defaultWorkoutName } from '@/domain/training/workout-name';
import { useChallengeConfig } from '@/features/challenge/use-challenge-config';
import { routineListQuery } from '@/features/routines/queries';
import { createRoutine } from '@/features/routines/repository';
import { activeWorkoutQuery, workoutHistoryQuery } from '@/features/workout-logging/queries';
import { startWorkout } from '@/features/workout-logging/repository';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ListRow } from '@/ui/list-row';
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

function RoutineRow({ id, name, isLast }: { id: string; name: string; isLast: boolean }) {
  return <ListRow title={name} onPress={() => router.push(`/routine/${id}`)} isLast={isLast} />;
}

function HistoryEntry({ workout, isLast }: { workout: HistoryRow; isLast: boolean }) {
  return (
    <ListRow
      title={workout.name}
      detail={format(workout.startedAt, 'EEE d MMM · HH:mm')}
      showChevron={false}
      isLast={isLast}
    />
  );
}

/**
 * The way into challenge mode, stated as what it does rather than what it is called —
 * a lifter scanning the Train tab should be able to tell whether they want it.
 */
function ChallengeCard() {
  const { enabled, settings } = useChallengeConfig();
  const range = `${settings.defaultRange.low}–${settings.defaultRange.high} reps`;

  return (
    <Card>
      <ListRow
        title="Challenge mode"
        detail={
          enabled ? `On · ${range} by default` : 'Off · progressive overload, session by session'
        }
        onPress={() => router.push('/challenge')}
        isLast
      />
    </Card>
  );
}

function RoutinesSection({ routines }: { routines: { id: string; name: string }[] }) {
  return (
    <Card
      title="Routines"
      action={
        <Pressable
          onPress={() => beginNewRoutine(routines.length)}
          hitSlop={10}
          className="active:opacity-60">
          <Text className="text-[15px] font-semibold text-accent">New</Text>
        </Pressable>
      }>
      {routines.length === 0 ? (
        <Text className="py-5 text-center text-[15px] text-content-muted">
          Save a workout as a routine, or start one here.
        </Text>
      ) : (
        routines.map((routine, index) => (
          <RoutineRow
            key={routine.id}
            id={routine.id}
            name={routine.name}
            isLast={index === routines.length - 1}
          />
        ))
      )}
    </Card>
  );
}

export default function WorkoutsScreen() {
  const active = useLiveQuery(activeWorkoutQuery());
  const routines = useLiveQuery(routineListQuery());
  const history = useLiveQuery(workoutHistoryQuery());
  const inProgress = active.data[0];

  return (
    <Screen title="Train">
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10">
        {inProgress ? (
          <ResumeBanner workoutId={inProgress.id} name={inProgress.name} />
        ) : (
          <Button label="Start empty workout" onPress={beginEmptySession} />
        )}

        <RoutinesSection routines={routines.data} />

        <ChallengeCard />

        {history.data.length > 0 && (
          <Card title="History">
            {history.data.map((workout, index) => (
              <HistoryEntry
                key={workout.id}
                workout={workout}
                isLast={index === history.data.length - 1}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
