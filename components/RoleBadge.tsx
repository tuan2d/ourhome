import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Share, ActivityIndicator, Platform, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useAppStore } from '../store/useAppStore';
import { useApi } from '../services/api';

export function RoleBadge() {
  const { signOut } = useAuth();
  const currentUser = useAppStore((s) => s.currentUser);
  const familyName = useAppStore((s) => s.familyName);
  const isParent = currentUser?.role === 'parent';
  const api = useApi();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShowInvite = async () => {
    setShowInvite(true);
    if (inviteCode) return;
    setLoading(true);
    try {
      const family = await api.family.mine();
      setInviteCode(family.inviteCode);
      if (!familyName) useAppStore.setState({ familyName: family.name });
    } catch {}
    finally { setLoading(false); }
  };

  const handleShare = async () => {
    const message = `Tham gia gia đình "${familyName}" trên OurHome!\nMã mời: ${inviteCode}`;
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text: message }).catch(() => {});
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        Alert.alert('Đã sao chép', 'Mã mời đã được sao chép vào clipboard.');
      }
    } else {
      Share.share({ message });
    }
  };

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isParent ? '#EFF9FF' : '#F0FDF4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5 }}>
          <Text style={{ fontSize: 14 }}>{currentUser?.avatar ?? '🏠'}</Text>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: isParent ? '#0EA5E9' : '#16A34A' }}>
              {currentUser?.name ?? ''}{isParent ? ' · Quản lý' : ''}
            </Text>
            {familyName && (
              <Text style={{ fontSize: 10, color: isParent ? '#7DD3FC' : '#86EFAC' }}>🏠 {familyName}</Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {isParent && (
            <TouchableOpacity onPress={handleShowInvite} style={{ backgroundColor: '#EFF9FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: '#0EA5E9', fontWeight: '600' }}>🔗 Mã mời</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => signOut()} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: '#8E9BAB' }}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showInvite} transparent animationType="fade" onRequestClose={() => setShowInvite(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setShowInvite(false)}>
          <View style={{ backgroundColor: '#FDF6EE', borderRadius: 24, padding: 28, width: 300, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🔗</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#2D3A4A', marginBottom: 4 }}>Mã mời gia đình</Text>
            {familyName ? <Text style={{ fontSize: 13, color: '#8E9BAB', marginBottom: 20 }}>🏠 {familyName}</Text> : null}

            {loading ? (
              <ActivityIndicator color="#0EA5E9" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <View style={{ backgroundColor: '#E0F2FE', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 8 }}>
                  <Text style={{ fontSize: 32, fontWeight: '800', color: '#0EA5E9', letterSpacing: 8, textAlign: 'center' }}>{inviteCode}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#B0BAC7', marginBottom: 20, textAlign: 'center' }}>
                  Gửi mã này cho thành viên{'\n'}để họ tham gia gia đình
                </Text>
                <TouchableOpacity onPress={handleShare} style={{ backgroundColor: '#0EA5E9', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32, width: '100%', alignItems: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                    {Platform.OS === 'web' ? 'Sao chép mã mời' : 'Chia sẻ mã mời'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
