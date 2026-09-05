import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from 'react-native';

import { useThemeColor, type ThemeColorName } from './use-theme-color';

/** Apple and Google both put the floor at 44pt; a 16pt glyph alone is not a target. */
const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };
const GLYPH_SIZE = 18;

export function IconButton({
  name,
  label,
  onPress,
  tone = 'contentFaint',
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: ThemeColorName;
}) {
  const color = useThemeColor(tone);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-sunken">
      <Ionicons name={name} size={GLYPH_SIZE} color={color} />
    </Pressable>
  );
}
