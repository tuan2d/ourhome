import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useAppStore } from '../store/useAppStore';
import { useApi, type ApiMember } from '../services/api';

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();
  const currentUser = useAppStore((s) => s.currentUser);
  const familyId = useAppStore((s) => s.familyId);
  const familyName = useAppStore((s) => s.familyName);
  const isParent = currentUser?.role === 'parent';
  const api = useApi();

  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [list, family] = await Promise.all([
          api.family.members(familyId!),
          isParent ? api.family.mine() : Promise.resolve(null),
        ]);
        setMembers(list);
        if (family) setInviteCode(family.inviteCode);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const handleCopy = async () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteCode);
      }
    } else {
      const { Clipboard } = await import('react-native');
      Clipboard.setString(inviteCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE' }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE8E1', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 18, color: '#2D3A4A' }}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 11, color: '#8E9BAB' }}>Tài khoản</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#2D3A4A' }}>Cài đặt</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* User card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#EDE8E1', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: isParent ? '#EFF9FF' : '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 30 }}>{currentUser?.avatar ?? '🧑'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#2D3A4A' }}>{currentUser?.name ?? ''}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={{ backgroundColor: isParent ? '#EFF9FF' : '#F0FDF4', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: isParent ? '#0EA5E9' : '#16A34A' }}>
                  {isParent ? '👑 Quản lý' : '🧒 Thành viên'}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#B0BAC7' }}>{currentUser?.totalPoints ?? 0} điểm</Text>
            </View>
          </View>
        </View>

        {/* Family info */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 10, letterSpacing: 0.5 }}>GIA ĐÌNH</Text>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EDE8E1', overflow: 'hidden', marginBottom: 16 }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: '#8E9BAB', width: 100 }}>Tên gia đình</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3A4A', flex: 1 }}>🏠 {familyName ?? '—'}</Text>
          </View>

          {/* Invite code — parent only */}
          {isParent && (
            <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#8E9BAB', width: 100 }}>Mã mời</Text>
              {loading ? (
                <ActivityIndicator color="#0EA5E9" size="small" />
              ) : (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#0EA5E9', letterSpacing: 4 }}>{inviteCode}</Text>
                  <TouchableOpacity
                    onPress={handleCopy}
                    style={{ backgroundColor: copied ? '#F0FDF4' : '#E0F2FE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: copied ? '#16A34A' : '#0EA5E9' }}>
                      {copied ? '✓ Đã copy' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Members */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 10, letterSpacing: 0.5 }}>
          THÀNH VIÊN ({members.length})
        </Text>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EDE8E1', overflow: 'hidden', marginBottom: 24 }}>
          {loading ? (
            <ActivityIndicator color="#0EA5E9" style={{ paddingVertical: 24 }} />
          ) : members.map((m, i) => {
            const isSelf = m.id === currentUser?.id;
            const isMemberParent = m.role === 'parent';
            return (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: i < members.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isMemberParent ? '#EFF9FF' : '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 22 }}>{m.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D3A4A' }}>{m.name}</Text>
                    {isSelf && (
                      <View style={{ backgroundColor: '#E0F2FE', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 10, color: '#0EA5E9', fontWeight: '700' }}>Bạn</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: isMemberParent ? '#0EA5E9' : '#16A34A', marginTop: 1 }}>
                    {isMemberParent ? '👑 Quản lý' : '🧒 Thành viên'}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D3A4A' }}>{m.totalPoints ?? 0} đ</Text>
              </View>
            );
          })}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ backgroundColor: '#FFF1F2', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECDD3' }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#E11D48' }}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
