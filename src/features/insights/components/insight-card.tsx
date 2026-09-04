import { Text, View } from 'react-native';

import type { Insight, InsightTone } from '@/domain/insights/types';

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
    <View className="flex-row gap-3 py-2.5">
      <View className={`mt-1.5 h-2 w-2 rounded-full ${TONE_ACCENT[insight.tone]}`} />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-content">{insight.title}</Text>
        <Text className="mt-0.5 text-xs leading-4 text-content-muted">{insight.evidence}</Text>
      </View>
    </View>
  );
}

export function InsightList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <View className="rounded-2xl border border-line bg-surface-raised px-4 py-2">
      <Text className="pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-content-faint">
        What your data says
      </Text>
      {insights.map((insight) => (
        <InsightRow key={insight.id} insight={insight} />
      ))}
    </View>
  );
}
