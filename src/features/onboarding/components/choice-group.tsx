import { Pressable, Text, View } from 'react-native';

export type Choice<T extends string> = {
  value: T;
  label: string;
  detail?: string;
};

/**
 * A vertical list of mutually exclusive options. Full-width rows rather than a segmented
 * control: the activity levels need a line of explanation each, and nobody can tell
 * "moderate" from "active" without one.
 */
export function ChoiceGroup<T extends string>({
  choices,
  selected,
  onSelect,
}: {
  choices: Choice<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <View className="gap-2">
      {choices.map((choice) => {
        const isSelected = choice.value === selected;
        return (
          <Pressable
            key={choice.value}
            onPress={() => onSelect(choice.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            className={`rounded-xl border px-4 py-3 active:opacity-70 ${
              isSelected ? 'border-accent bg-accent/10' : 'border-line bg-surface-raised'
            }`}>
            <Text
              className={`text-base ${isSelected ? 'font-semibold text-accent' : 'text-content'}`}>
              {choice.label}
            </Text>
            {choice.detail ? (
              <Text className="mt-0.5 text-xs leading-4 text-content-muted">{choice.detail}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
