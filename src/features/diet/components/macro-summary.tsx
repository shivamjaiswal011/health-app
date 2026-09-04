import { Text, View } from 'react-native';

import type { Macros } from '@/domain/nutrition/macros';
import { progressToward } from '@/domain/nutrition/macros';

const FULL_BAR = 1;
const PERCENT = 100;

export type MacroTarget = {
  kcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

type BarProps = {
  label: string;
  consumed: number;
  target: number | null;
  unit: string;
};

function MacroBar({ label, consumed, target, unit }: BarProps) {
  const fraction = target === null ? 0 : progressToward(consumed, target);
  const isOver = fraction > FULL_BAR;
  const width = `${Math.min(fraction, FULL_BAR) * PERCENT}%` as const;

  return (
    <View className="flex-1 gap-1">
      <Text className="text-[11px] uppercase text-content-faint">{label}</Text>
      <Text className="text-sm font-semibold text-content">
        {Math.round(consumed)}
        {target === null ? '' : ` / ${Math.round(target)}`}
        <Text className="text-xs font-normal text-content-faint">{unit}</Text>
      </Text>
      {target === null ? null : (
        <View className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
          <View className={`h-full ${isOver ? 'bg-warning' : 'bg-accent'}`} style={{ width }} />
        </View>
      )}
    </View>
  );
}

/** The day at a glance. Targets are optional — totals are useful on their own. */
export function MacroSummary({ totals, target }: { totals: Macros; target: MacroTarget | null }) {
  return (
    <View className="gap-3 rounded-2xl border border-line bg-surface-raised p-4">
      <View className="flex-row items-end justify-between">
        <Text className="text-3xl font-bold text-content">{Math.round(totals.kcal)}</Text>
        <Text className="text-sm text-content-faint">
          {target === null ? 'kcal' : `of ${Math.round(target.kcal)} kcal`}
        </Text>
      </View>
      <View className="flex-row gap-4">
        <MacroBar
          label="Protein"
          consumed={totals.protein}
          target={target?.proteinGrams ?? null}
          unit="g"
        />
        <MacroBar
          label="Carbs"
          consumed={totals.carbs}
          target={target?.carbsGrams ?? null}
          unit="g"
        />
        <MacroBar label="Fat" consumed={totals.fat} target={target?.fatGrams ?? null} unit="g" />
      </View>
    </View>
  );
}
