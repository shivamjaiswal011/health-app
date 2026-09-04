import { Pressable, Text } from 'react-native';

const VARIANT_CLASSES = {
  primary: { container: 'bg-accent', label: 'text-white' },
  secondary: { container: 'bg-surface-raised border border-line', label: 'text-content' },
  danger: { container: 'bg-danger', label: 'text-white' },
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASSES;

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
};

/** Full-width tappable action. Height is fixed at 48pt to stay thumb-reachable mid-set. */
export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const classes = VARIANT_CLASSES[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`h-12 items-center justify-center rounded-xl px-5 active:opacity-70 ${classes.container} ${disabled ? 'opacity-40' : ''}`}>
      <Text className={`text-base font-semibold ${classes.label}`}>{label}</Text>
    </Pressable>
  );
}
