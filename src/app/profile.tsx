import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { formatWeight } from '@/domain/units/weight';
import { activityLabel, goalLabel, sexLabel } from '@/features/profile/labels';
import { useProfileOverview } from '@/features/profile/use-profile-overview';
import { bodyweightUnit } from '@/features/settings/units';
import { Card } from '@/ui/card';
import { EmptyState } from '@/ui/empty-state';
import { ListRow } from '@/ui/list-row';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

type Overview = ReturnType<typeof useProfileOverview>;

function AboutCard({ details, weightKg }: Pick<Overview, 'details' | 'weightKg'>) {
  if (!details) return null;

  return (
    <Card title="About you">
      <ListRow title="Sex" trailing={<Value text={sexLabel(details.sex)} />} showChevron={false} />
      <ListRow title="Age" trailing={<Value text={`${details.ageYears}`} />} showChevron={false} />
      <ListRow
        title="Height"
        trailing={<Value text={`${Math.round(details.heightCm)} cm`} />}
        showChevron={false}
      />
      <ListRow
        title="Weight"
        detail="From your most recent weigh-in"
        trailing={
          <Value text={weightKg === null ? '—' : formatWeight(weightKg, bodyweightUnit())} />
        }
        showChevron={false}
        isLast
      />
    </Card>
  );
}

function Value({ text }: { text: string }) {
  return <Text className="text-[17px] text-content-muted">{text}</Text>;
}

function PlanCard({ details, maintenanceKcal }: Pick<Overview, 'details' | 'maintenanceKcal'>) {
  if (!details) return null;

  return (
    <Card title="Your plan">
      <ListRow
        title="Goal"
        trailing={<Value text={goalLabel(details.goal)} />}
        showChevron={false}
      />
      <ListRow
        title="Activity"
        trailing={<Value text={activityLabel(details.activity)} />}
        showChevron={false}
      />
      <ListRow
        title="Maintenance"
        detail="Estimated from your height, weight, age and activity"
        detailLines={2}
        trailing={<Value text={maintenanceKcal === null ? '—' : `${maintenanceKcal} kcal`} />}
        showChevron={false}
        isLast
      />
    </Card>
  );
}

function TargetsCard({ targets }: Pick<Overview, 'targets'>) {
  if (!targets) return null;

  return (
    <Card
      title="Daily targets"
      action={
        <Pressable onPress={() => router.push('/diet/targets')} className="active:opacity-60">
          <Text className="text-[15px] font-semibold text-accent">Edit</Text>
        </Pressable>
      }>
      <ListRow
        title="Calories"
        trailing={<Value text={`${Math.round(targets.kcal)} kcal`} />}
        showChevron={false}
      />
      <ListRow
        title="Protein"
        trailing={<Value text={`${Math.round(targets.proteinGrams)} g`} />}
        showChevron={false}
      />
      <ListRow
        title="Carbohydrate"
        trailing={<Value text={`${Math.round(targets.carbsGrams)} g`} />}
        showChevron={false}
      />
      <ListRow
        title="Fat"
        trailing={<Value text={`${Math.round(targets.fatGrams)} g`} />}
        showChevron={false}
        isLast
      />
    </Card>
  );
}

export default function ProfileScreen() {
  const overview = useProfileOverview();

  return (
    <Screen>
      <ScreenHeader left={{ label: 'Back', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Profile</Text>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10">
        {overview.details ? (
          <>
            <AboutCard details={overview.details} weightKg={overview.weightKg} />
            <PlanCard details={overview.details} maintenanceKcal={overview.maintenanceKcal} />
            <TargetsCard targets={overview.targets} />
            <View>
              <Text className="text-[13px] leading-[19px] text-content-faint">
                Log a new weigh-in from the Progress tab. Everything here stays on this device.
              </Text>
            </View>
          </>
        ) : (
          <EmptyState
            title="No profile yet"
            message="Finish the welcome questions and your details will appear here."
          />
        )}
      </ScrollView>
    </Screen>
  );
}
