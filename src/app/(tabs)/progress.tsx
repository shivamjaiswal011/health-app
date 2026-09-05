import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { MINIMUM_POINTS_TO_CHART } from '@/domain/progress/time-series';
import { VolumeChart } from '@/features/progress/components/volume-chart';
import { WeightCard } from '@/features/progress/components/weight-card';
import { trainedExercisesQuery, weeklyVolumeQuery } from '@/features/progress/queries';
import { ListRow } from '@/ui/list-row';
import { Screen } from '@/ui/screen';
import { useThemeColor } from '@/ui/use-theme-color';

function VolumeCard() {
  const weeks = useLiveQuery(weeklyVolumeQuery());
  const accent = useThemeColor('accent');
  // Queried newest first for the limit; charted oldest first so time runs left to right.
  const chronological = [...weeks.data].reverse();
  const latest = weeks.data[0];

  return (
    <View className="gap-3 rounded-2xl bg-surface-raised p-4">
      <Text className="text-[15px] font-semibold text-content">Weekly volume</Text>
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
    <View className="rounded-2xl bg-surface-raised p-4">
      <Text className="pb-1 text-[15px] font-semibold text-content">Strength</Text>
      {trained.data.length === 0 ? (
        <Text className="py-6 text-center text-sm text-content-muted">
          Complete some sets and each lift gets its own estimated one-rep max chart.
        </Text>
      ) : (
        trained.data.map((exercise, index) => (
          <ListRow
            key={exercise.id}
            title={exercise.name}
            onPress={() => router.push(`/progress/${encodeURIComponent(exercise.id)}`)}
            isLast={index === trained.data.length - 1}
          />
        ))
      )}
    </View>
  );
}

export default function ProgressScreen() {
  return (
    <Screen title="Progress">
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10">
        <WeightCard />
        <VolumeCard />
        <StrengthCard />
      </ScrollView>
    </Screen>
  );
}
