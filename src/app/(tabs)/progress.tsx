import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { MINIMUM_POINTS_TO_CHART } from '@/domain/progress/time-series';
import { VolumeChart } from '@/features/progress/components/volume-chart';
import { WeightCard } from '@/features/progress/components/weight-card';
import { trainedExercisesQuery, weeklyVolumeQuery } from '@/features/progress/queries';
import { Screen } from '@/ui/screen';
import { useThemeColor } from '@/ui/use-theme-color';

function VolumeCard() {
  const weeks = useLiveQuery(weeklyVolumeQuery());
  const accent = useThemeColor('accent');
  // Queried newest first for the limit; charted oldest first so time runs left to right.
  const chronological = [...weeks.data].reverse();
  const latest = weeks.data[0];

  return (
    <View className="gap-3 rounded-2xl border border-line bg-surface-raised p-4">
      <Text className="text-xs font-semibold uppercase tracking-wide text-content-faint">
        Weekly volume
      </Text>
      {chronological.length < MINIMUM_POINTS_TO_CHART ? (
        <Text className="py-6 text-center text-sm text-content-muted">
          Log a couple of weeks of training and your tonnage per week appears here.
        </Text>
      ) : (
        <>
          <Text className="text-xs text-content-muted">
            {Math.round(latest.volume).toLocaleString()} kg this week · {latest.setCount} sets
          </Text>
          <VolumeChart weeks={chronological} color={accent} />
        </>
      )}
    </View>
  );
}

function StrengthCard() {
  const trained = useLiveQuery(trainedExercisesQuery());

  return (
    <View className="rounded-2xl border border-line bg-surface-raised p-4">
      <Text className="pb-1 text-xs font-semibold uppercase tracking-wide text-content-faint">
        Strength
      </Text>
      {trained.data.length === 0 ? (
        <Text className="py-6 text-center text-sm text-content-muted">
          Complete some sets and each lift gets its own estimated one-rep max chart.
        </Text>
      ) : (
        trained.data.map((exercise) => (
          <Pressable
            key={exercise.id}
            onPress={() => router.push(`/progress/${encodeURIComponent(exercise.id)}`)}
            className="flex-row items-center justify-between border-b border-line py-3 active:opacity-60">
            <Text className="flex-1 text-base text-content" numberOfLines={1}>
              {exercise.name}
            </Text>
            <Text className="text-sm text-content-faint">›</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

export default function ProgressScreen() {
  return (
    <Screen title="Progress">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8">
        <WeightCard />
        <VolumeCard />
        <StrengthCard />
      </ScrollView>
    </Screen>
  );
}
