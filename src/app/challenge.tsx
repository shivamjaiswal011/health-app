import { router } from 'expo-router';
import { ScrollView, Switch, Text, View } from 'react-native';

import type { RepRange } from '@/domain/training/challenge';
import { useChallengeConfig } from '@/features/challenge/use-challenge-config';
import { Card } from '@/ui/card';
import { ListRow } from '@/ui/list-row';
import { Screen } from '@/ui/screen';
import { ScreenHeader } from '@/ui/screen-header';

/** The ranges most programmes are written around, rather than a free-form number pair. */
const RANGE_CHOICES: RepRange[] = [
  { low: 3, high: 5 },
  { low: 6, high: 8 },
  { low: 8, high: 12 },
  { low: 12, high: 15 },
];

function label(range: RepRange): string {
  return `${range.low}–${range.high}`;
}

function RangeChoice({
  range,
  selected,
  onPress,
}: {
  range: RepRange;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <ListRow
      title={`${label(range)} reps`}
      onPress={onPress}
      showChevron={false}
      isLast={range === RANGE_CHOICES[RANGE_CHOICES.length - 1]}
      trailing={selected ? <Text className="text-[17px] font-semibold text-accent">✓</Text> : null}
    />
  );
}

function HowItWorks() {
  return (
    <Text className="text-[13px] leading-[19px] text-content-faint">
      Every session asks for one more rep than you managed last time, on every working set. Miss it
      and the same target comes back until you clear it. Clear the top of the range and the weight
      goes up by the smallest jump the equipment takes, with the reps starting again at the bottom.
    </Text>
  );
}

export default function ChallengeScreen() {
  const { enabled, settings, toggleEnabled, toggleBackoff, chooseRange } = useChallengeConfig();

  return (
    <Screen>
      <ScreenHeader left={{ label: 'Back', onPress: () => router.back(), tone: 'muted' }} />
      <Text className="px-5 pb-3 text-3xl font-bold text-content">Challenge mode</Text>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10">
        <Card>
          <ListRow
            title="Challenge mode"
            detail="Sets open at a target to beat instead of last session's numbers."
            showChevron={false}
            isLast={!enabled}
            trailing={<Switch value={enabled} onValueChange={toggleEnabled} />}
          />
          {enabled ? (
            <ListRow
              title="Back-off set"
              detail="One extra set after the work, four more reps at 20% lighter."
              showChevron={false}
              isLast
              trailing={<Switch value={settings.backoffSets} onValueChange={toggleBackoff} />}
            />
          ) : null}
        </Card>

        {enabled ? (
          <Card title="Default rep range">
            {RANGE_CHOICES.map((range) => (
              <RangeChoice
                key={label(range)}
                range={range}
                selected={
                  range.low === settings.defaultRange.low &&
                  range.high === settings.defaultRange.high
                }
                onPress={() => chooseRange(range)}
              />
            ))}
          </Card>
        ) : null}

        <View>
          <HowItWorks />
        </View>
      </ScrollView>
    </Screen>
  );
}
