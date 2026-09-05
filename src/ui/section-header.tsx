import { Text, View } from 'react-native';

/**
 * A section label. Sentence case at a readable size, rather than the tiny all-caps
 * tracking that dates a screen to iOS 7 — and legible to someone who is not looking
 * closely, which on a phone in a gym is everyone.
 */
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-1 pb-2">
      <Text className="text-base font-semibold text-content">{title}</Text>
      {action}
    </View>
  );
}
