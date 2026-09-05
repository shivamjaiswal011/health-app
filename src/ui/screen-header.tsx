import { Pressable, Text, View } from 'react-native';

const TONE_CLASSES = {
  accent: 'text-accent',
  danger: 'text-danger',
  muted: 'text-content-muted',
} as const;

export type HeaderAction = {
  label: string;
  onPress: () => void;
  tone?: keyof typeof TONE_CLASSES;
};

function ActionText({ action }: { action: HeaderAction }) {
  return (
    <Pressable
      onPress={action.onPress}
      accessibilityRole="button"
      className="py-1 active:opacity-60">
      <Text className={`text-sm font-semibold ${TONE_CLASSES[action.tone ?? 'accent']}`}>
        {action.label}
      </Text>
    </Pressable>
  );
}

/**
 * Left/right actions above a screen's content. Every pushed screen needs a way back;
 * the root stack hides its own header so that has to be explicit here.
 */
export function ScreenHeader({ left, right }: { left?: HeaderAction; right?: HeaderAction }) {
  return (
    <View className="h-9 flex-row items-center justify-between px-5">
      {left ? <ActionText action={left} /> : <View />}
      {right ? <ActionText action={right} /> : <View />}
    </View>
  );
}
