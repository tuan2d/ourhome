import { View, Text, TouchableOpacity } from 'react-native';
import type { Reward } from '../constants/mockData';

interface Props {
  reward: Reward;
  balance: number;
  onRedeem?: (id: string) => void;
}

export function RewardCard({ reward, balance, onRedeem }: Props) {
  const canAfford = balance >= reward.cost;
  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
      <Text className="text-sm font-semibold text-brand mb-1">{reward.title}</Text>
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-accent font-bold">{reward.cost} điểm</Text>
        <TouchableOpacity
          onPress={() => canAfford && onRedeem?.(reward.id)}
          className={`px-4 py-1.5 rounded-full ${canAfford ? 'bg-accent' : 'bg-border'}`}
        >
          <Text className={`text-xs font-semibold ${canAfford ? 'text-white' : 'text-muted'}`}>
            {canAfford ? 'Đổi thưởng' : 'Chưa đủ điểm'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
