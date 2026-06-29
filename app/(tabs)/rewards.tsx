import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useApi, type ApiReward, type ApiPointTransaction } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { RoleBadge } from '../../components/RoleBadge';

export default function Rewards() {
  const { currentUser } = useAppStore();
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isParent = currentUser?.role === 'parent';
  const [showAdd, setShowAdd] = useState(false);

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<ApiReward[]>({
    queryKey: ['rewards'],
    queryFn: () => api.reward.list(),
    enabled: !!currentUser,
  });

  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['points', currentUser?.id],
    queryFn: () => api.point.get(currentUser!.id),
    enabled: !!currentUser,
  });

  const redeemMutation = useMutation({
    mutationFn: (id: string) => api.reward.redeem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.reward.create>[0]) => api.reward.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rewards'] }); setShowAdd(false); },
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const balance = pointsData?.totalPoints ?? currentUser?.totalPoints ?? 0;
  const weeklyPoints = pointsData?.weeklyPoints ?? currentUser?.weeklyPoints ?? 0;
  const history: ApiPointTransaction[] = pointsData?.history ?? [];
  const affordable = rewards.filter((r) => r.costPoints <= balance).length;

  const handleRedeem = (reward: ApiReward) => {
    if (balance < reward.costPoints) {
      Alert.alert('Không đủ điểm', `Cần ${reward.costPoints} điểm, bạn có ${balance} điểm.`);
      return;
    }
    Alert.alert(
      'Đổi thưởng',
      `Xác nhận đổi "${reward.title}" với ${reward.costPoints} điểm?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Đổi ngay', onPress: () => redeemMutation.mutate(reward.id) },
      ],
    );
  };

  if (!currentUser) return null;

  const isLoading = rewardsLoading || pointsLoading;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-muted">Điểm thưởng</Text>
          <Text className="text-2xl font-bold text-brand mt-0.5">Đổi thưởng minh bạch</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE8E1', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <RoleBadge />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Balance card */}
        <View className="mx-4 mb-4 bg-accent rounded-3xl p-5">
          <Text className="text-white/70 text-xs text-center">Tổng điểm hiện có</Text>
          {pointsLoading ? (
            <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 16 }} />
          ) : (
            <Text className="text-white text-5xl font-bold text-center mt-2">{balance}</Text>
          )}
          <Text className="text-white/60 text-xs text-center mt-1">điểm tích lũy</Text>
          <View className="flex-row mt-4 pt-4 border-t border-white/20">
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-xs">Có thể đổi</Text>
              <Text className="text-white font-bold text-lg mt-1">{affordable} phần thưởng</Text>
            </View>
            <View className="w-px bg-white/20" />
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-xs">Tuần này kiếm được</Text>
              <Text className="text-white font-bold text-lg mt-1">+{weeklyPoints} điểm</Text>
            </View>
          </View>
        </View>

        {/* Reward list */}
        <View className="mx-4 mb-4">
          <Text className="text-xs font-bold text-muted tracking-wider mb-3">PHẦN THƯỞNG CÓ THỂ ĐỔI</Text>
          {rewardsLoading ? (
            <ActivityIndicator color="#0EA5E9" />
          ) : rewards.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EDE8E1' }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🎁</Text>
              <Text style={{ fontSize: 14, color: '#8E9BAB' }}>Chưa có phần thưởng nào</Text>
            </View>
          ) : (
            rewards.map((reward) => {
              const canAfford = balance >= reward.costPoints;
              return (
                <View key={reward.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EDE8E1', padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginRight: 12 }}>{reward.emoji || '🎁'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#2D3A4A' }}>{reward.title}</Text>
                    <Text style={{ fontSize: 13, color: '#0EA5E9', fontWeight: '700', marginTop: 2 }}>{reward.costPoints} điểm</Text>
                  </View>
                  {!isParent && (
                    <TouchableOpacity
                      onPress={() => handleRedeem(reward)}
                      disabled={!canAfford || redeemMutation.isPending}
                      style={{ backgroundColor: canAfford ? '#0EA5E9' : '#E0F2FE', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: canAfford ? '#FFFFFF' : '#93C5FD' }}>Đổi</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Parent: Add reward empty state hint */}
        {isParent && rewards.length === 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 14, borderWidth: 1, borderColor: '#BBF7D0' }}>
            <Text style={{ fontSize: 13, color: '#16A34A', textAlign: 'center' }}>Nhấn + để thêm phần thưởng cho con đổi 🎁</Text>
          </View>
        )}

        {/* Transaction history */}
        <View className="mx-4 bg-surface border border-border rounded-3xl p-4">
          <Text className="text-xs font-bold text-muted tracking-wider mb-3">LỊCH SỬ GIAO DỊCH</Text>
          {history.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#B0BAC7', textAlign: 'center', paddingVertical: 16 }}>Chưa có giao dịch nào</Text>
          ) : (
            history.slice(0, 20).map((tx, i) => (
              <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: i < history.length - 1 ? 1 : 0, borderBottomColor: '#EDE8E1' }}>
                <Text style={{ fontSize: 13, color: '#2D3A4A', flex: 1 }}>{tx.note ?? (tx.type === 'earn' ? 'Hoàn thành việc' : 'Đổi thưởng')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: tx.type === 'earn' ? '#16A34A' : '#0EA5E9' }}>
                  {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB for parent */}
      {isParent && (
        <View style={{ position: 'absolute', bottom: 80, right: 20 }}>
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '300', lineHeight: 34 }}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddRewardModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />
    </SafeAreaView>
  );
}

// ── Add Reward Modal ──────────────────────────────────────────────────────────
function AddRewardModal({ visible, onClose, onAdd, loading }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; costPoints: number; emoji?: string }) => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [emoji, setEmoji] = useState('🎁');

  const EMOJI_OPTIONS = ['🎁', '🍕', '🍦', '🎮', '🎬', '🏖️', '🛍️', '🎠', '⭐', '🏆'];

  const reset = () => { setTitle(''); setCost(''); setEmoji('🎁'); };
  const handleClose = () => { reset(); onClose(); };

  const handleAdd = () => {
    if (!title.trim() || !cost.trim()) { Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và số điểm.'); return; }
    const costNum = parseInt(cost);
    if (isNaN(costNum) || costNum <= 0) { Alert.alert('Số điểm không hợp lệ', 'Số điểm phải là số dương.'); return; }
    onAdd({ title: title.trim(), costPoints: costNum, emoji });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={handleClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <View style={{ backgroundColor: '#FDF6EE', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#EDE8E1', alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#2D3A4A', marginBottom: 20 }}>Thêm phần thưởng</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 8 }}>BIỂU TƯỢNG</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {EMOJI_OPTIONS.map((e) => (
                  <TouchableOpacity key={e} onPress={() => setEmoji(e)}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: emoji === e ? '#E0F2FE' : '#FFFFFF', borderWidth: 2, borderColor: emoji === e ? '#0EA5E9' : '#EDE8E1', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>TÊN PHẦN THƯỞNG *</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Ví dụ: Ăn pizza, Xem phim..." placeholderTextColor="#B0BAC7"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: title ? '#0EA5E9' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2D3A4A', marginBottom: 16 }} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>SỐ ĐIỂM CẦN ĐỔI *</Text>
            <TextInput value={cost} onChangeText={setCost} placeholder="Ví dụ: 50" placeholderTextColor="#B0BAC7" keyboardType="numeric"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: cost ? '#0EA5E9' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2D3A4A', marginBottom: 16 }} />
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity onPress={handleClose} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#EDE8E1', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#8E9BAB' }}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} disabled={loading || !title.trim() || !cost.trim()}
              style={{ flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: title.trim() && cost.trim() ? '#16A34A' : '#DCFCE7', alignItems: 'center' }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontSize: 15, fontWeight: '700', color: title.trim() && cost.trim() ? '#FFFFFF' : '#86EFAC' }}>Thêm phần thưởng ✓</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
