import { View, Text, TouchableOpacity } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import type { Role } from '../constants/mockData';

export function RoleSwitcher() {
  const { role, setRole } = useAppStore();

  const btn = (r: Role, label: string) => (
    <TouchableOpacity
      onPress={() => setRole(r)}
      className={`flex-1 py-2 rounded-full items-center ${role === r ? 'bg-accent' : 'bg-transparent'}`}
    >
      <Text className={`text-sm font-semibold ${role === r ? 'text-white' : 'text-muted'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-row bg-border rounded-full p-1 mx-4 mb-4">
      {btn('child', 'Góc nhìn của con')}
      {btn('parent', 'Góc nhìn bố mẹ')}
    </View>
  );
}
