import { useState, type ReactNode } from 'react';
import { TextInput, View } from 'react-native';

const DECIMAL_ENTRY = /^\d*\.?\d*$/;

type NumberInputProps = {
  defaultValue: number | null;
  onChangeValue: (value: number | null) => void;
  placeholder?: string;
  /**
   * Rendered against the right edge. Only that side is padded — reserving both would
   * leave a narrow column too little room for the value, which then clips silently.
   */
  accessory?: ReactNode;
};

function parseEntry(text: string): number | null {
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Numeric field for weight and reps.
 *
 * Deliberately uncontrolled: the field owns its text so a half-typed "12." survives
 * until the user finishes. To reset it — starting a new set — remount it with a
 * different React `key` rather than pushing a new value in.
 */
export function NumberInput({
  defaultValue,
  onChangeValue,
  placeholder,
  accessory,
}: NumberInputProps) {
  const [text, setText] = useState(() => (defaultValue === null ? '' : String(defaultValue)));

  function handleChangeText(next: string) {
    if (!DECIMAL_ENTRY.test(next)) return;
    setText(next);
    onChangeValue(parseEntry(next));
  }

  return (
    <View className="relative">
      <TextInput
        value={text}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        selectTextOnFocus
        className={`h-11 rounded-xl bg-surface-sunken text-center text-[17px] font-semibold text-content ${accessory ? 'pl-1.5 pr-8' : 'px-2'}`}
      />
      {accessory}
    </View>
  );
}
