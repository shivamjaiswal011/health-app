import { Pressable, Text } from 'react-native';

const VARIANT_CLASSES = {
  primary: { container: 'bg-accent', label: 'text-white' },
  secondary: { container: 'bg-surface-sunken', label: 'text-content' },
  ghost: { container: '', label: 'text-accent' },
  danger: { container: '', label: 'text-danger' },
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASSES;

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
};

/**
 * Full-width action. Height is fixed at 50pt — comfortably past the 44pt floor, because
 * the primary action is often pressed mid-set with one hand.
 *
 * `ghost` and `danger` carry no fill: a destructive action should not compete visually
 * with the thing the user actually came to do.
 */
export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const classes = VARIANT_CLASSES[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`h-[50px] items-center justify-center rounded-2xl px-5 active:opacity-70 ${classes.container} ${disabled ? 'opacity-40' : ''}`}>
      <Text className={`text-[17px] font-semibold ${classes.label}`}>{label}</Text>
    </Pressable>
  );
}
