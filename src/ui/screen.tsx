import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  title?: string;
};

/** Standard page frame: safe-area top padding, app background, optional large title. */
export function Screen({ children, title }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {title ? (
        <Text className="px-5 pb-2 pt-3 text-3xl font-bold text-content">{title}</Text>
      ) : null}
      {children}
    </View>
  );
}
