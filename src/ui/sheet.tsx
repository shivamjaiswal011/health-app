import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  title?: string;
};

/** Bottom sheet for pickers and quick forms. Tapping the scrim dismisses. */
export function Sheet({ visible, onDismiss, children, title }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/50" onPress={onDismiss} accessibilityLabel="Dismiss" />
      <View className="rounded-t-3xl border-t border-line bg-surface-raised px-5 pb-10 pt-4">
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-line" />
        {title ? <Text className="mb-4 text-lg font-semibold text-content">{title}</Text> : null}
        {children}
      </View>
    </Modal>
  );
}
