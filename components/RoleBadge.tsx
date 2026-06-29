import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Platform, Alert, ScrollView, Clipboard } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useAppStore } from '../store/useAppStore';
import { useApi, type ApiMember } from '../services/api';

export function RoleBadge() {
  const { signOut } = useAuth();
  const currentUser = useAppStore((s) => s.currentUser);
  const familyId = useAppStore((s) => s.familyId);
  const familyName = useAppStore((s) => s.familyName);
  const isParent = currentUser?.role === 'parent';
  const api = useApi();

  const [showMembers, setShowMembers] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShowMembers = async () => {
    setShowMembers(true);
    if (members.length > 0) return;
    setMembersLoading(true);
    try {
      const [list, family] = await Promise.all([
        api.family.members(familyId!),
        isParent ? api.family.mine() : Promise.resolve(null),
      ]);
      setMembers(list);
      if (family) {
        setInviteCode(family.inviteCode);
        if (!familyName) useAppStore.setState({ familyName: family.name });
      }
    } catch {}
    finally { setMembersLoading(false); }
  };

  const handleCopy = async () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteCode);
      }
    } else {
      Clipboard.setString(inviteCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8 }}>
        <TouchableOpacity
          onPress={handleShowMembers}
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
          <Text style={{ fontSize: 10, color: isParent ? '#7DD3FC' : '#86EFAC', marginLeft: 2 }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => signOut()} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, color: '#8E9BAB' }}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showMembers} transparent animationType="slide" onRequestClose={() => setShowMembers(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setShowMembers(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FDF6EE', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, maxHeight: '75%' }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#EDE8E1', alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#2D3A4A', marginBottom: 4 }}>Thành viên gia đình</Text>
          {familyName && <Text style={{ fontSize: 13, color: '#8E9BAB', marginBottom: 16 }}>🏠 {familyName}</Text>}

          {membersLoading ? (
            <ActivityIndicator color="#0EA5E9" style={{ paddingVertical: 32 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Invite code — parent only */}
              {isParent && inviteCode ? (
                <View style={{ backgroundColor: '#E0F2FE', borderRadius: 16, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#7DD3FC', fontWeight: '600', marginBottom: 4 }}>MÃ MỜI GIA ĐÌNH</Text>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#0EA5E9', letterSpacing: 6 }}>{inviteCode}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCopy}
                    style={{ backgroundColor: copied ? '#16A34A' : '#0EA5E9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{copied ? '✓ Đã copy' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>
              ) : isParent && (
                <ActivityIndicator color="#0EA5E9" style={{ marginBottom: 16 }} />
              )}

              {members.map((m) => {
                const isSelf = m.id === currentUser?.id;
                const isMemberParent = m.role === 'parent';
                return (
                  <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isMemberParent ? '#EFF9FF' : '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                      <Text style={{ fontSize: 26 }}>{m.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#2D3A4A' }}>{m.name}</Text>
                        {isSelf && (
                          <View style={{ backgroundColor: '#E0F2FE', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ fontSize: 10, color: '#0EA5E9', fontWeight: '600' }}>Bạn</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: isMemberParent ? '#0EA5E9' : '#16A34A', marginTop: 2 }}>
                        {isMemberParent ? '👑 Quản lý' : '🧒 Thành viên'}
                      </Text>
                      <Text style={{ fontSize: 10, color: '#C0C9D4', marginTop: 1 }} selectable>id: {m.id}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#2D3A4A' }}>{m.totalPoints ?? 0}</Text>
                      <Text style={{ fontSize: 10, color: '#B0BAC7' }}>điểm</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}
