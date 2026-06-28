import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApi } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '@clerk/clerk-expo';

type Mode = 'pick' | 'create' | 'join';

export default function FamilySetup() {
  const router = useRouter();
  const api = useApi();
  const { signOut } = useAuth();
  const setFamilyId = (id: string) => useAppStore.setState({ familyId: id });
  const [mode, setMode] = useState<Mode>('pick');
  const [loading, setLoading] = useState(false);

  // Create form
  const [familyName, setFamilyName] = useState('');

  // Join form
  const [inviteCode, setInviteCode] = useState('');
  const [joinRole, setJoinRole] = useState<'parent' | 'child'>('child');

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setLoading(true);
    try {
      const res: any = await api.family.create(familyName.trim());
      if (res?.id) setFamilyId(res.id);
      router.replace('/(tabs)/tasks');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message ?? 'Không thể tạo gia đình');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    try {
      const res: any = await api.family.join(inviteCode.trim().toUpperCase(), joinRole);
      if (res?.family?.id) setFamilyId(res.family.id);
      router.replace('/(tabs)/tasks');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message ?? 'Mã không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'pick') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE' }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>🏠</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#2D3A4A' }}>Thiết lập gia đình</Text>
            <Text style={{ fontSize: 14, color: '#8E9BAB', marginTop: 8, textAlign: 'center' }}>
              Tạo gia đình mới hoặc tham gia{'\n'}gia đình đang có bằng mã mời
            </Text>
          </View>

          <View style={{ gap: 14 }}>
            <TouchableOpacity
              onPress={() => setMode('create')}
              style={{
                backgroundColor: '#0EA5E9',

                borderRadius: 20,
                paddingVertical: 20,
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                shadowColor: '#0EA5E9',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 36 }}>✨</Text>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF' }}>Tạo gia đình mới</Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Bạn sẽ là quản lý</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('join')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                paddingVertical: 20,
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                borderWidth: 1.5,
                borderColor: '#EDE8E1',
              }}
            >
              <Text style={{ fontSize: 36 }}>🔗</Text>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#2D3A4A' }}>Tham gia gia đình</Text>
                <Text style={{ fontSize: 13, color: '#8E9BAB', marginTop: 2 }}>Nhập mã mời từ quản lý</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => signOut()}
              style={{ alignItems: 'center', paddingVertical: 14 }}
            >
              <Text style={{ fontSize: 13, color: '#B0BAC7' }}>Đăng xuất tài khoản khác</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'create') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE' }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
            <TouchableOpacity onPress={() => setMode('pick')} style={{ marginBottom: 24 }}>
              <Text style={{ color: '#8E9BAB', fontSize: 14 }}>← Quay lại</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginBottom: 36 }}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>✨</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#2D3A4A' }}>Tạo gia đình mới</Text>
              <Text style={{ fontSize: 14, color: '#8E9BAB', marginTop: 6 }}>Đặt tên cho gia đình của bạn</Text>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 8 }}>TÊN GIA ĐÌNH</Text>
            <TextInput
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="Ví dụ: Nhà Minh, Gia đình Nguyễn..."
              placeholderTextColor="#B0BAC7"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: familyName ? '#0EA5E9' : '#EDE8E1',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#2D3A4A',
                marginBottom: 24,
              }}
            />

            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading || !familyName.trim()}
              style={{
                backgroundColor: familyName.trim() ? '#0EA5E9' : '#E0F2FE',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: '#0EA5E9',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: familyName.trim() ? 0.3 : 0,
                shadowRadius: 10,
                elevation: familyName.trim() ? 5 : 0,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '700', color: familyName.trim() ? '#FFFFFF' : '#93C5FD' }}>
                  Tạo gia đình →
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // mode === 'join'
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          <TouchableOpacity onPress={() => setMode('pick')} style={{ marginBottom: 24 }}>
            <Text style={{ color: '#8E9BAB', fontSize: 14 }}>← Quay lại</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🔗</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#2D3A4A' }}>Tham gia gia đình</Text>
            <Text style={{ fontSize: 14, color: '#8E9BAB', marginTop: 6 }}>Nhập mã mời từ quản lý gia đình</Text>
          </View>

          <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 8 }}>MÃ MỜI</Text>
          <TextInput
            value={inviteCode}
            onChangeText={(t) => setInviteCode(t.toUpperCase())}
            placeholder="ABC123"
            placeholderTextColor="#B0BAC7"
            autoCapitalize="characters"
            maxLength={6}
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: inviteCode ? '#0EA5E9' : '#EDE8E1',
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 24,
              letterSpacing: 6,
              color: '#2D3A4A',
              textAlign: 'center',
              marginBottom: 20,
            }}
          />

          <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 10 }}>VAI TRÒ CỦA BẠN</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            {(['child', 'parent'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setJoinRole(r)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: joinRole === r ? '#0EA5E9' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: joinRole === r ? '#0EA5E9' : '#EDE8E1',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{r === 'child' ? '🧒' : '👨‍👩‍👧'}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: joinRole === r ? '#FFFFFF' : '#8E9BAB' }}>
                  {r === 'child' ? 'Con cái' : 'Phụ huynh'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleJoin}
            disabled={loading || inviteCode.length < 6}
            style={{
              backgroundColor: inviteCode.length >= 6 ? '#0EA5E9' : '#E0F2FE',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              shadowColor: '#0EA5E9',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: inviteCode.length >= 6 ? 0.3 : 0,
              shadowRadius: 10,
              elevation: inviteCode.length >= 6 ? 5 : 0,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: inviteCode.length >= 6 ? '#FFFFFF' : '#93C5FD' }}>
                Tham gia →
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
