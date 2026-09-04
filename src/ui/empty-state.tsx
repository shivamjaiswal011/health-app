import { Text, View } from 'react-native';

import { Button } from './button';

type EmptyStateProps = {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

/** Shown wherever a list has no rows yet. Always offers the next step, never a dead end. */
export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-8">
      <Text className="text-center text-lg font-semibold text-content">{title}</Text>
      <Text className="text-center text-sm text-content-muted">{message}</Text>
      {action ? (
        <View className="mt-4 w-full max-w-xs">
          <Button label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}
