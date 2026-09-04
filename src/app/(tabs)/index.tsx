import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { today } from '@/domain/nutrition/calendar-day';
import { sumMacros } from '@/domain/nutrition/macros';
import { dayEntriesQuery, targetForDayQuery } from '@/features/diet/queries';
import { InsightList } from '@/features/insights/components/insight-card';
import { useInsights } from '@/features/insights/use-insights';
import { bodyWeightQuery, weeklyVolumeQuery } from '@/features/progress/queries';
import { activeWorkoutQuery, workoutHistoryQuery } from '@/features/workout-logging/queries';
import { Screen } from '@/ui/screen';

function SummaryTile({
  label,
  value,
  detail,
  onPress,
}: {
  label: string;
  value: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-2xl border border-line bg-surface-raised p-4 active:opacity-70">
      <Text className="text-[11px] font-semibold uppercase tracking-wide text-content-faint">
        {label}
      </Text>
      <Text className="mt-1 text-2xl font-bold text-content">{value}</Text>
      <Text className="mt-0.5 text-xs text-content-muted" numberOfLines={1}>
        {detail}
      </Text>
    </Pressable>
  );
}

function ResumeBanner({ workoutId, name }: { workoutId: string; name: string }) {
  return (
    <Pressable
      onPress={() => router.push(`/workout/${workoutId}`)}
      className="rounded-2xl bg-accent px-4 py-3 active:opacity-80">
      <Text className="text-xs font-semibold uppercase text-white/80">Workout in progress</Text>
      <Text className="mt-0.5 text-base font-semibold text-white">{name}</Text>
    </Pressable>
  );
}

function useTodaySummary() {
  const day = today();
  const entries = useLiveQuery(dayEntriesQuery(day), [day]);
  const targets = useLiveQuery(targetForDayQuery(day), [day]);
  const weeks = useLiveQuery(weeklyVolumeQuery());
  const weights = useLiveQuery(bodyWeightQuery());
  const history = useLiveQuery(workoutHistoryQuery());

  const eaten = sumMacros(entries.data);
  const target = targets.data[0];
  const thisWeek = weeks.data[0];
  const latestWeight = weights.data[weights.data.length - 1];

  return { eaten, target, thisWeek, latestWeight, lastWorkout: history.data[0] };
}

type TileContent = { value: string; detail: string };

type DaySummary = ReturnType<typeof useTodaySummary>;

/** Each tile reads differently before any data exists, so the wording is decided here
 *  rather than inline where it would tangle the layout with four conditionals. */
function tiles(summary: DaySummary): Record<string, TileContent> {
  const { eaten, target, thisWeek, latestWeight } = summary;
  const weighed = latestWeight?.weightKg;

  return {
    energy: {
      value: `${Math.round(eaten.kcal)}`,
      detail: target ? `of ${Math.round(target.kcal)} kcal` : 'kcal today',
    },
    protein: {
      value: `${Math.round(eaten.protein)}g`,
      detail: target ? `of ${Math.round(target.proteinGrams)}g` : 'logged today',
    },
    training: {
      value: thisWeek ? `${thisWeek.setCount}` : '0',
      detail: thisWeek
        ? `sets · ${Math.round(thisWeek.volume).toLocaleString()} kg`
        : 'sets logged',
    },
    weight: {
      value: weighed ? weighed.toFixed(1) : '—',
      detail: weighed ? 'kg, last weigh-in' : 'not logged yet',
    },
  };
}

export default function TodayScreen() {
  const active = useLiveQuery(activeWorkoutQuery());
  const summary = useTodaySummary();
  const insights = useInsights();
  const tile = tiles(summary);
  const inProgress = active.data[0];

  return (
    <Screen title="Today">
      <ScrollView contentContainerClassName="gap-3 px-5 pb-8">
        {inProgress ? <ResumeBanner workoutId={inProgress.id} name={inProgress.name} /> : null}

        <View className="flex-row gap-3">
          <SummaryTile label="Eaten" {...tile.energy} onPress={() => router.push('/diet')} />
          <SummaryTile label="Protein" {...tile.protein} onPress={() => router.push('/diet')} />
        </View>

        <View className="flex-row gap-3">
          <SummaryTile
            label="This week"
            {...tile.training}
            onPress={() => router.push('/progress')}
          />
          <SummaryTile label="Weight" {...tile.weight} onPress={() => router.push('/progress')} />
        </View>

        <InsightList insights={insights} />

        <Pressable
          onPress={() => router.push('/settings')}
          className="items-center py-2 active:opacity-60">
          <Text className="text-sm font-semibold text-accent">Settings</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/workouts')}
          className="rounded-2xl border border-line bg-surface-raised px-4 py-3 active:opacity-70">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-content-faint">
            Last session
          </Text>
          <Text className="mt-1 text-base text-content">
            {summary.lastWorkout ? summary.lastWorkout.name : 'Nothing logged yet'}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
