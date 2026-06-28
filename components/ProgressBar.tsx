import { View, Text } from 'react-native';

interface Props {
  label: string;
  value: number;
}

export function ProgressBar({ label, value }: Props) {
  return (
    <View className="flex-row items-center gap-3 mb-3">
      <Text className="text-xs font-semibold text-brand w-10">{label}</Text>
      <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <View className="h-full bg-accent rounded-full" style={{ width: `${value}%` }} />
      </View>
      <Text className="text-xs text-muted w-8 text-right">{value}%</Text>
    </View>
  );
}
