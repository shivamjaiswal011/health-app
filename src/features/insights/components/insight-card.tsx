import { Text, View } from 'react-native';

import type { Insight, InsightTone } from '@/domain/insights/types';
import { Card } from '@/ui/card';

const TONE_ACCENT: Record<InsightTone, string> = {
  positive: 'bg-positive',
  neutral: 'bg-accent',
  attention: 'bg-warning',
};

/**
 * One observation and the numbers behind it. The evidence is not optional detail —
 * it is what separates an insight from a horoscope, and what lets the user disagree.
 */
function InsightRow({ insight }: { insight: Insight }) {
  return (
    <View className="flex-row gap-3 py-3">
      <View className={`mt-[7px] h-2 w-2 rounded-full ${TONE_ACCENT[insight.tone]}`} />
      <View className="flex-1">
        <Text className="text-[15px] font-semibold leading-5 text-content">{insight.title}</Text>
        <Text className="mt-1 text-[13px] leading-[18px] text-content-muted">
          {insight.evidence}
        </Text>
      </View>
    </View>
  );
}

export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <Card title="What your data says">
      {insights.map((insight) => (
        <InsightRow key={insight.id} insight={insight} />
      ))}
    </Card>
  );
}
