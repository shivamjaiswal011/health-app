import { Pressable, Text, View } from 'react-native';

import { toOneDecimal } from '@/domain/nutrition/rounding';

import type { FoodHit } from './queries';

export function FoodOption({ hit, onPick }: { hit: FoodHit; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} className="border-b border-line px-5 py-3 active:bg-surface-sunken">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-base text-content" numberOfLines={1}>
          {hit.name}
        </Text>
        {hit.source === 'custom' ? (
          <Text className="text-[10px] uppercase text-content-faint">yours</Text>
        ) : null}
      </View>
      {/* Rounded here rather than at the source: recipes derive their per-100g figures
          by division, so they arrive with far more digits than are meaningful. */}
      <Text className="mt-0.5 text-xs text-content-faint">
        {Math.round(hit.kcalPer100g)} kcal · P{toOneDecimal(hit.proteinPer100g)} · C
        {toOneDecimal(hit.carbsPer100g)} · F{toOneDecimal(hit.fatPer100g)} per 100 g
      </Text>
    </Pressable>
  );
}
