import { View, Text, TouchableOpacity } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useRouter } from 'expo-router';

export function RoleBadge() {
  const currentUser = useAppStore((s) => s.currentUser);
  const familyName = useAppStore((s) => s.familyName);
  const isParent = currentUser?.role === 'parent';
  const router = useRouter();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8 }}>
      <TouchableOpacity
        onPress={() => router.push('/settings')}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isParent ? '#EFF9FF' : '#F0FDF4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, gap: 5 }}
      >
        <Text style={{ fontSize: 14 }}>{currentUser?.avatar ?? '🏠'}</Text>
        <View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: isParent ? '#0EA5E9' : '#16A34A' }}>
            {currentUser?.name ?? ''}{isParent ? ' · Quản lý' : ''}
          </Text>
          {familyName && (
            <Text style={{ fontSize: 10, color: isParent ? '#7DD3FC' : '#86EFAC' }}>🏠 {familyName}</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
