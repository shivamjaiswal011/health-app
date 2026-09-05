import { Text, View } from 'react-native';

import { NumberInput } from '@/ui/number-input';

export function MeasureField({
  label,
  unit,
  placeholder,
  onChange,
}: {
  label: string;
  unit: string;
  placeholder: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-line py-3">
      <Text className="text-base text-content">{label}</Text>
      <View className="flex-row items-center gap-2">
        <View className="w-24">
          <NumberInput defaultValue={null} onChangeValue={onChange} placeholder={placeholder} />
        </View>
        <Text className="w-8 text-sm text-content-faint">{unit}</Text>
      </View>
    </View>
  );
}
