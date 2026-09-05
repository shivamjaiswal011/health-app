import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { PerformedExercise } from '@/features/history/components/performed-exercise';
import { SessionTotalsBar } from '@/features/history/components/session-totals-bar';
import { usePastSession } from '@/features/history/use-past-session';
import { EmptyState } from '@/ui/empty-state';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { header, exercises, totals, minutes } = usePastSession(id);

  return (
    <Screen>
      <ScreenHeader left={{ label: 'Back', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 text-3xl font-bold text-content">{header?.name ?? 'Session'}</Text>
      <Text className="px-5 pb-4 pt-1 text-[13px] text-content-muted">
        {header ? format(header.startedAt, 'EEEE d MMMM · HH:mm') : ''}
      </Text>
      <ScrollView contentContainerClassName="px-5 pb-10">
        <SessionTotalsBar
          minutes={minutes}
          setCount={totals.setCount}
          tonnageKg={totals.tonnageKg}
        />
        {exercises.length === 0 ? (
          <EmptyState
            title="Nothing in this session"
            message="No exercises were logged before it was saved."
          />
        ) : (
          <View className="rounded-2xl bg-surface-raised px-4">
            {exercises.map((exercise, index) => (
              <PerformedExercise
                key={exercise.id}
                name={exercise.name}
                sets={exercise.sets}
                isLast={index === exercises.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
