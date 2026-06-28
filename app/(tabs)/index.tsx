import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { RoleBadge } from '../../components/RoleBadge';
import { useApi, type ApiMember, type ApiTaskRow } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

export default function Dashboard() {
  const { currentUser, familyId } = useAppStore();
  const api = useApi();
  const isParent = currentUser?.role === 'parent';

  const { data: members = [] } = useQuery<ApiMember[]>({
    queryKey: ['members', familyId],
    queryFn: () => api.family.members(familyId!),
    enabled: !!familyId,
  });

  const { data: taskRows = [] } = useQuery<ApiTaskRow[]>({
    queryKey: ['tasks'],
    queryFn: () => api.task.list(),
    enabled: !!currentUser,
  });

  const allChildren = members.filter((m) => m.role === 'child');

  const targetIds = isParent ? allChildren.map((m) => m.id) : [currentUser?.id ?? ''];

  const myTasks = taskRows.filter((r) => targetIds.includes(r.task.assignedTo));
  const doneTasks = myTasks.filter((r) => r.task.status !== 'pending').length;
  const weeklyRate = myTasks.length > 0 ? Math.round((doneTasks / myTasks.length) * 100) : 0;

  const totalPoints = isParent
    ? allChildren.reduce((s, m) => s + m.totalPoints, 0)
    : currentUser?.totalPoints ?? 0;

  const previewRows = isParent
    ? allChildren.flatMap((m) => taskRows.filter((r) => r.task.assignedTo === m.id).slice(0, 2))
    : taskRows.filter((r) => r.task.assignedTo === (currentUser?.id ?? '')).slice(0, 3);

  if (!currentUser) return null;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-muted">Xin chào gia đình</Text>
            <Text className="text-2xl font-bold text-brand mt-0.5">Bảng điều khiển</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-accent-light items-center justify-center">
            <Text className="text-lg">🔔</Text>
          </View>
        </View>

        <RoleBadge />

        {/* Hero stats */}
        <View className="flex-row mx-4 gap-3 mb-4">
          <StatCard label="Việc hôm nay" value={String(myTasks.length)} accent />
          <StatCard label="Hoàn thành" value={`${weeklyRate}%`} />
          <StatCard label="Điểm tích lũy" value={String(totalPoints)} />
        </View>

        {/* Focus card */}
        <View className="mx-4 mb-4 bg-accent rounded-3xl p-4 flex-row items-center gap-3">
          <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
            <Text className="text-2xl">{currentUser.avatar}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white/70 text-xs font-medium">{currentUser.focusBadge}</Text>
            <Text className="text-white font-bold text-base mt-0.5">{currentUser.name}</Text>
            <Text className="text-white/60 text-xs mt-1">
              {isParent ? 'Theo dõi và hỗ trợ các thành viên gia đình.' : 'Cùng hoàn thành từng việc nhỏ để mở quà cuối tuần.'}
            </Text>
          </View>
        </View>

        {/* Children summary (parent only) */}
        {isParent && allChildren.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="text-xs font-bold text-muted tracking-wider mb-3">THÀNH VIÊN</Text>
            <View className="flex-row gap-3">
              {allChildren.map((m) => {
                const childTasks = taskRows.filter((r) => r.task.assignedTo === m.id);
                const childDone = childTasks.filter((r) => r.task.status !== 'pending').length;
                const pct = childTasks.length > 0 ? Math.round((childDone / childTasks.length) * 100) : 0;
                return (
                  <View key={m.id} className="flex-1 bg-surface border border-border rounded-2xl p-3 items-center">
                    <Text style={{ fontSize: 28, marginBottom: 4 }}>{m.avatar}</Text>
                    <Text className="text-sm font-bold text-brand">{m.name}</Text>
                    <Text className="text-xs text-muted mt-1">{childDone}/{childTasks.length} việc</Text>
                    <View className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-2">
                      <View className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </View>
                    <Text className="text-xs text-accent font-semibold mt-1">{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Task preview */}
        {previewRows.length > 0 && (
          <View className="mx-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-brand">{isParent ? 'Việc của các con' : 'Việc hôm nay'}</Text>
              <Text className="text-xs text-muted">{doneTasks}/{myTasks.length} hoàn thành</Text>
            </View>
            <View className="bg-surface border border-border rounded-3xl px-4">
              {previewRows.map((row) => {
                const done = row.task.status !== 'pending';
                return (
                  <View key={row.task.id} style={{ borderBottomWidth: 1, borderBottomColor: '#EDE8E1', paddingVertical: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#0EA5E9' : '#FFFFFF', borderColor: done ? '#0EA5E9' : '#EDE8E1' }}>
                        {done && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        {isParent && row.assignee && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            <Text style={{ fontSize: 13 }}>{row.assignee.avatar}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#8E9BAB' }}>{row.assignee.name}</Text>
                          </View>
                        )}
                        <Text style={{ fontSize: 14, fontWeight: '500', color: done ? '#8E9BAB' : '#2D3A4A', textDecorationLine: done ? 'line-through' : 'none' }}>
                          {row.task.title}
                        </Text>
                        {row.task.points > 0 && (
                          <Text style={{ fontSize: 11, color: '#0EA5E9', fontWeight: '600', marginTop: 2 }}>+{row.task.points} điểm</Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className={`flex-1 rounded-2xl p-3 items-center ${accent ? 'bg-accent' : 'bg-surface border border-border'}`}>
      <Text className={`text-xs text-center ${accent ? 'text-white/70' : 'text-muted'}`}>{label}</Text>
      <Text className={`text-xl font-bold mt-1 ${accent ? 'text-white' : 'text-brand'}`}>{value}</Text>
    </View>
  );
}
