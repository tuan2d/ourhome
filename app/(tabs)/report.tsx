import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ProgressBar } from '../../components/ProgressBar';
import { RoleBadge } from '../../components/RoleBadge';
import { useApi, type ApiMember, type ApiTaskRow, type ApiGoal } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

export default function Report() {
  const { currentUser, familyId } = useAppStore();
  const api = useApi();
  const isParent = currentUser?.role === 'parent';

  const { data: members = [] } = useQuery<ApiMember[]>({
    queryKey: ['members', familyId],
    queryFn: () => api.family.members(familyId!),
    enabled: !!familyId,
  });

  const { data: taskRows = [], isLoading: tasksLoading } = useQuery<ApiTaskRow[]>({
    queryKey: ['tasks'],
    queryFn: () => api.task.list(),
    enabled: !!currentUser,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<ApiGoal[]>({
    queryKey: ['goals'],
    queryFn: () => api.goal.list(),
    enabled: !!currentUser,
  });

  if (!currentUser) return null;

  const allChildren = members.filter((m) => m.role === 'child');
  const targetIds = isParent ? allChildren.map((m) => m.id) : [currentUser.id];

  const myTasks = taskRows.filter((r) => targetIds.includes(r.task.assignedTo));
  const doneTasks = myTasks.filter((r) => r.task.status !== 'pending').length;

  const bars = isParent
    ? allChildren.map((m) => {
        const mTasks = taskRows.filter((r) => r.task.assignedTo === m.id);
        const mDone = mTasks.filter((r) => r.task.status !== 'pending').length;
        return { label: m.name, value: mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0 };
      })
    : myTasks.length > 0 ? [{ label: currentUser.name, value: Math.round((doneTasks / myTasks.length) * 100) }] : [];

  const ring = bars.length > 0 ? Math.round(bars.reduce((s, b) => s + b.value, 0) / bars.length) : 0;

  const totalPoints = isParent
    ? allChildren.reduce((s, m) => s + m.totalPoints, 0)
    : currentUser.totalPoints;

  const approvedPoints = taskRows
    .filter((r) => targetIds.includes(r.task.assignedTo) && r.task.status === 'approved')
    .reduce((s, r) => s + r.task.points, 0);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xs text-muted">Báo cáo</Text>
        <Text className="text-2xl font-bold text-brand mt-0.5">Tiến độ tuần / tháng</Text>
      </View>

      <RoleBadge />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row mx-4 gap-3 mb-4">
          <View className="flex-1 bg-surface border border-border rounded-2xl p-3 items-center">
            <Text className="text-xs text-muted">Hoàn thành</Text>
            <Text className="text-2xl font-bold text-accent mt-1">{ring}%</Text>
          </View>
          <View className="flex-1 bg-surface border border-border rounded-2xl p-3 items-center">
            <Text className="text-xs text-muted">Tổng điểm</Text>
            <Text className="text-2xl font-bold text-brand mt-1">{totalPoints}</Text>
          </View>
          <View className="flex-1 bg-surface border border-border rounded-2xl p-3 items-center">
            <Text className="text-xs text-muted">Đã duyệt</Text>
            <Text className="text-2xl font-bold text-brand mt-1">+{approvedPoints}</Text>
          </View>
        </View>

        <View className="mx-4 mb-4 bg-surface border border-border rounded-3xl p-4">
          <Text className="text-xs font-bold text-muted tracking-wider mb-4">TIẾN ĐỘ TUẦN NÀY</Text>
          {tasksLoading ? (
            <ActivityIndicator color="#0EA5E9" style={{ paddingVertical: 24 }} />
          ) : (
            <>
              <View className="items-center mb-5">
                <View className="w-28 h-28 rounded-full items-center justify-center" style={{ borderWidth: 10, borderColor: '#EDE8E1' }}>
                  <View style={{ position: 'absolute', width: 112, height: 112, borderRadius: 56, borderWidth: 10, borderColor: '#0EA5E9', borderRightColor: 'transparent', borderBottomColor: ring > 50 ? '#0EA5E9' : 'transparent', transform: [{ rotate: `${-90 + ring * 3.6}deg` }] }} />
                  <Text className="text-2xl font-bold text-accent">{ring}%</Text>
                  <Text className="text-xs text-muted">Tuần</Text>
                </View>
              </View>
              {bars.map((bar, i) => (
                <ProgressBar key={i} label={bar.label} value={bar.value} />
              ))}
            </>
          )}
        </View>

        <View className="mx-4">
          <Text className="text-xs font-bold text-muted tracking-wider mb-3">MỤC TIÊU DÀI HẠN</Text>
          {goalsLoading ? (
            <ActivityIndicator color="#0EA5E9" />
          ) : goals.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EDE8E1' }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
              <Text style={{ fontSize: 14, color: '#8E9BAB' }}>Chưa có mục tiêu nào</Text>
            </View>
          ) : (
            goals.map((goal) => {
              const pct = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
              return (
                <View key={goal.id} className="bg-surface border border-border rounded-2xl p-4 mb-3">
                  <Text className="text-sm font-semibold text-brand mb-1">{goal.title}</Text>
                  {goal.note && <Text className="text-xs text-muted mb-3">{goal.note}</Text>}
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <View className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </View>
                    <Text className="text-xs font-bold text-accent">{goal.currentValue}/{goal.targetValue}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
