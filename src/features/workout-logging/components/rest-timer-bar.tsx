import { Pressable, Text, View } from 'react-native';

import { useRestTimer } from '../rest-timer';
import { useRestCountdown } from '../use-rest-countdown';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PADDING = 2;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(SECONDS_PADDING, '0')}`;
}

/** Sits above the tab bar while resting; absent entirely when no timer is running. */
export function RestTimerBar() {
  const remaining = useRestCountdown();
  const stopRest = useRestTimer((state) => state.stopRest);

  if (remaining === null) return null;

  return (
    <View className="flex-row items-center justify-between border-t border-line bg-accent px-5 py-3">
      <Text className="text-sm font-medium text-white">Rest</Text>
      <Text className="text-lg font-bold tabular-nums text-white">
        {formatCountdown(remaining)}
      </Text>
      <Pressable onPress={stopRest} accessibilityRole="button" className="active:opacity-70">
        <Text className="text-sm font-semibold text-white">Skip</Text>
      </Pressable>
    </View>
  );
}
