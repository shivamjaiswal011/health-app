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
import { Card } from '@/ui/card';
import { IconButton } from '@/ui/icon-button';
import { ListRow } from '@/ui/list-row';
import { Screen } from '@/ui/screen';
import { formatWeightTotal, toDisplayWeight } from '@/domain/units/weight';
import { bodyweightUnit, displayUnit } from '@/features/settings/units';

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
      className="flex-1 rounded-2xl bg-surface-raised p-4 active:opacity-70">
      <Text className="text-[13px] font-medium text-content-muted">{label}</Text>
      <Text className="mt-1.5 text-[28px] font-bold leading-tight text-content">{value}</Text>
      <Text className="mt-0.5 text-[13px] text-content-faint" numberOfLines={1}>
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
        ? `sets · ${formatWeightTotal(thisWeek.volume, displayUnit())}`
        : 'sets logged',
    },
    weight: {
      value: weighed ? String(toDisplayWeight(weighed, bodyweightUnit())) : '—',
      detail: weighed ? `${bodyweightUnit()}, last weigh-in` : 'not logged yet',
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
    <Screen
      title="Today"
      action={
        <IconButton
          name="settings-outline"
          label="Settings"
          onPress={() => router.push('/settings')}
        />
      }>
      <ScrollView contentContainerClassName="gap-4 px-5 pb-10">
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

        <Card title="Last session">
          <ListRow
            title={summary.lastWorkout ? summary.lastWorkout.name : 'Nothing logged yet'}
            detail={summary.lastWorkout ? 'View training history' : 'Start one from the Train tab'}
            onPress={() => router.push('/workouts')}
            isLast
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
