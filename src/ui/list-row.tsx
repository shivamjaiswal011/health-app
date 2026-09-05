import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeColor } from './use-theme-color';

const CHEVRON_SIZE = 18;

/**
 * One tappable row inside a card. The chevron is drawn as an icon rather than a "›"
 * character, which sits on the text baseline and renders at whatever weight the font
 * feels like.
 */
export function ListRow({
  title,
  detail,
  onPress,
  trailing,
  showChevron = true,
  isLast = false,
}: {
  title: string;
  detail?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
}) {
  const faint = useThemeColor('contentFaint');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center gap-3 py-3.5 ${isLast ? '' : 'border-b border-line'} ${
        onPress ? 'active:opacity-60' : ''
      }`}>
      <View className="flex-1">
        <Text className="text-base text-content" numberOfLines={1}>
          {title}
        </Text>
        {detail ? (
          <Text className="mt-0.5 text-[13px] leading-4 text-content-muted" numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onPress && showChevron ? (
        <Ionicons name="chevron-forward" size={CHEVRON_SIZE} color={faint} />
      ) : null}
    </Pressable>
  );
}
