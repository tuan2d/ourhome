import { View, Text } from 'react-native';
import type { Goal } from '../constants/mockData';

export function GoalItem({ goal }: { goal: Goal }) {
  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
      <Text className="text-sm font-semibold text-brand mb-1">{goal.title}</Text>
      <Text className="text-xs text-muted mb-3">{goal.note}</Text>
      <View className="flex-row items-center gap-3">
        <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <View className="h-full bg-accent rounded-full" style={{ width: `${goal.value}%` }} />
        </View>
        <Text className="text-xs font-bold text-accent">{goal.value}%</Text>
      </View>
    </View>
  );
}
