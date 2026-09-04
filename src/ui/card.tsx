import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type CardProps = {
  children: ReactNode;
  title?: string;
};

/** Grouping container for a section of the dashboard or a logged exercise block. */
export function Card({ children, title }: CardProps) {
  return (
    <View className="rounded-2xl border border-line bg-surface-raised p-4">
      {title ? (
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-content-faint">
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
