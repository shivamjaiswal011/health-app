import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Standard page frame. The large title carries generous space beneath it so content
 * does not crowd the heading — the most common way a screen reads as cramped.
 *
 * `action` sits on the title's baseline rather than in a separate bar, which is where
 * a screen-level control belongs when there is no navigation bar to hold it.
 */
export function Screen({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {title ? (
        <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
          <Text className="text-[34px] font-bold leading-tight text-content">{title}</Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}
