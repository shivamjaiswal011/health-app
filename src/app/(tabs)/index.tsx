import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { ScrollView, Text, View } from 'react-native';

import { countActiveRows } from '@/db/queries';
import { exercises, foodEntries, workouts } from '@/db/schema';
import { Card } from '@/ui/card';
import { Screen } from '@/ui/screen';

type CountRowProps = { label: string; count: number };

function CountRow({ label, count }: CountRowProps) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-content-muted">{label}</Text>
      <Text className="text-sm font-semibold text-content">{count}</Text>
    </View>
  );
}

function useActiveRowCount(table: Parameters<typeof countActiveRows>[0]): number {
  const { data } = useLiveQuery(countActiveRows(table));
  return data[0]?.value ?? 0;
}

/**
 * Placeholder dashboard for M1. Its only job today is to prove the database opened,
 * migrated, and answers live queries on device — the real Today screen lands in M5.
 */
export default function TodayScreen() {
  const exerciseCount = useActiveRowCount(exercises);
  const workoutCount = useActiveRowCount(workouts);
  const foodEntryCount = useActiveRowCount(foodEntries);

  return (
    <Screen title="Today">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8">
        <Card title="Database">
          <CountRow label="Exercises" count={exerciseCount} />
          <CountRow label="Workouts" count={workoutCount} />
          <CountRow label="Food entries" count={foodEntryCount} />
        </Card>
        <Text className="px-1 text-xs text-content-faint">
          Schema migrated and reading live. Logging arrives in M2.
        </Text>
      </ScrollView>
    </Screen>
  );
}
