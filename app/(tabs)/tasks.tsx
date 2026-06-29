import { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useApi, type ApiMember, type ApiTaskRow } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { DEFAULT_TAGS } from '../../constants/mockData';
import { AddTaskModal } from '../../components/AddTaskModal';

const STATUS_FILTERS = ['Tất cả', 'Chờ hoàn thành', 'Đã xong'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function Tasks() {
  const { currentUser, familyId, selectedMemberIds, setSelectedMembers } = useAppStore();
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isParent = currentUser?.role === 'parent';

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Tất cả');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: members = [] } = useQuery<ApiMember[]>({
    queryKey: ['members', familyId],
    queryFn: () => api.family.members(familyId!),
    enabled: !!familyId,
  });

  const { data: taskRows = [], isLoading } = useQuery<ApiTaskRow[]>({
    queryKey: ['tasks'],
    queryFn: () => api.task.list(),
    enabled: !!currentUser,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.task.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.task.create>[0]) => api.task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setShowAdd(false); },
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  if (!currentUser) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 32 }}>⏳</Text>
      </SafeAreaView>
    );
  }

  // Parent sees all members (including themselves), child sees only self
  const targetMemberIds = isParent
    ? (selectedMemberIds.length > 0 ? selectedMemberIds : members.map((m) => m.id))
    : [currentUser.id];

  type DisplayTask = {
    id: string; title: string; done: boolean; tags: string[];
    points: number; memberId: string; memberName: string; memberAvatar: string;
    status: 'pending' | 'done' | 'approved';
    dueDate: string | null; repeat: string | null;
  };

  const allTasks: DisplayTask[] = taskRows
    .filter((row) => targetMemberIds.includes(row.task.assignedTo))
    .map((row) => ({
      id: row.task.id,
      title: row.task.title,
      done: row.task.status !== 'pending',
      tags: row.task.tags ?? [],
      points: row.task.points,
      memberId: row.task.assignedTo,
      memberName: row.assignee?.name ?? '?',
      memberAvatar: row.assignee?.avatar ?? '🧑',
      status: row.task.status,
      dueDate: row.task.dueDate ?? null,
      repeat: row.task.repeat ?? null,
    }));

  const allTags = Array.from(new Set([...DEFAULT_TAGS, ...allTasks.flatMap((t) => t.tags)]));

  const filtered = allTasks.filter((t) => {
    const matchStatus =
      statusFilter === 'Chờ hoàn thành' ? !t.done :
      statusFilter === 'Đã xong' ? t.done : true;
    const matchTag = selectedTag ? t.tags.includes(selectedTag) : true;
    return matchStatus && matchTag;
  });

  const done = allTasks.filter((t) => t.done).length;
  const pct = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;

  const targetMemberNames = isParent
    ? (selectedMemberIds.length > 0
        ? members.filter((m) => selectedMemberIds.includes(m.id)).map((m) => m.name)
        : members.map((m) => m.name))
    : [currentUser.name];

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-brand">Việc cần hoàn thành</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE8E1', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Member filter (parent only) */}
      {isParent && members.length > 0 && (
        <MemberFilter members={members} selected={selectedMemberIds} onChange={setSelectedMembers} currentUserId={currentUser.id} />
      )}

      {/* Progress card */}
      <View className="mx-4 mb-3 bg-accent rounded-3xl p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-white/70 text-xs">
              {targetMemberNames.join(' · ') || 'Tiến độ hôm nay'}
            </Text>
            <Text className="text-white text-2xl font-bold mt-1">{done}/{allTasks.length} việc</Text>
          </View>
          <View className="w-16 h-16 rounded-full border-4 border-white/30 items-center justify-center">
            <Text className="text-white font-bold text-lg">{pct}%</Text>
          </View>
        </View>
        <View className="h-1.5 bg-white/30 rounded-full overflow-hidden">
          <View className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
        </View>
      </View>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-2" style={{ flexGrow: 0 }}>
        <View className="flex-row gap-2">
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-full border ${statusFilter === f ? 'bg-accent border-accent' : 'bg-surface border-border'}`}
            >
              <Text className={`text-xs font-semibold ${statusFilter === f ? 'text-white' : 'text-muted'}`}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Tag filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3" style={{ flexGrow: 0 }}>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setSelectedTag(null)}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: selectedTag === null ? '#2D3A4A' : '#FFFFFF', borderWidth: 1, borderColor: selectedTag === null ? '#2D3A4A' : '#EDE8E1' }}
          >
            <Text style={{ fontSize: 12, color: selectedTag === null ? '#FFFFFF' : '#8E9BAB', fontWeight: '600' }}>Tất cả tag</Text>
          </TouchableOpacity>
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: selectedTag === tag ? '#E0F2FE' : '#FFFFFF', borderWidth: 1, borderColor: selectedTag === tag ? '#0EA5E9' : '#EDE8E1' }}
            >
              <Text style={{ fontSize: 12, color: selectedTag === tag ? '#0EA5E9' : '#8E9BAB', fontWeight: '600' }}>🏷 {tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator color="#0EA5E9" />
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">🎉</Text>
            <Text className="text-sm font-semibold text-brand">Hoàn thành hết rồi!</Text>
            <Text className="text-xs text-muted mt-1">Không còn việc nào cần làm.</Text>
          </View>
        ) : (
          <View className="mx-4 bg-surface border border-border rounded-3xl px-4">
            {filtered.map((task, i) => (
              <View key={task.id} style={{ borderBottomWidth: i < filtered.length - 1 ? 1 : 0, borderBottomColor: '#EDE8E1', paddingVertical: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => { if (!task.done) completeMutation.mutate(task.id); }}
                    style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: task.done ? '#0EA5E9' : '#EDE8E1', backgroundColor: task.done ? '#0EA5E9' : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {task.done && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    {isParent && (
                      <Text style={{ fontSize: 11, color: '#8E9BAB', marginBottom: 2 }}>{task.memberAvatar} {task.memberName}</Text>
                    )}
                    <Text style={{ fontSize: 15, fontWeight: '600', color: task.done ? '#B0BAC7' : '#2D3A4A', textDecorationLine: task.done ? 'line-through' : 'none' }}>
                      {task.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {task.points > 0 && (
                        <Text style={{ fontSize: 11, color: '#0EA5E9', fontWeight: '600' }}>+{task.points} điểm</Text>
                      )}
                      {task.status === 'done' && (
                        <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '600' }}>⏳ Chờ duyệt</Text>
                      )}
                      {task.status === 'approved' && (
                        <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '600' }}>✅ Đã duyệt</Text>
                      )}
                      {task.dueDate && (
                        <Text style={{ fontSize: 10, color: '#F59E0B', backgroundColor: '#FEF9C3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          📅 {new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </Text>
                      )}
                      {task.repeat && (
                        <Text style={{ fontSize: 10, color: '#8B5CF6', backgroundColor: '#F3E8FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          🔁 {{ daily: 'Hàng ngày', weekly: 'Hàng tuần', monthly: 'Hàng tháng' }[task.repeat] ?? task.repeat}
                        </Text>
                      )}
                      {task.tags.map((tag) => (
                        <Text key={tag} style={{ fontSize: 10, color: '#8E9BAB', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>🏷 {tag}</Text>
                      ))}
                    </View>
                  </View>
                  {isParent && task.status === 'done' && (
                    <TouchableOpacity
                      onPress={() => api.task.approve(task.id).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                      style={{ backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}
                    >
                      <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '700' }}>Duyệt</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <View style={{ position: 'absolute', bottom: 80, right: 20 }}>
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '300', lineHeight: 34 }}>+</Text>
        </TouchableOpacity>
      </View>

      <AddTaskModal
        visible={showAdd}
        availableTags={allTags}
        assignableMembers={isParent ? members : []}
        defaultAssignees={
          isParent
            ? (selectedMemberIds.length > 0 ? selectedMemberIds : [currentUser.id])
            : [currentUser.id]
        }
        isParent={isParent}
        currentUserId={currentUser.id}
        onClose={() => setShowAdd(false)}
        onAdd={(taskData, assigneeIds) => createMutation.mutate({ ...taskData, assigneeIds })}
        loading={createMutation.isPending}
      />
    </SafeAreaView>
  );
}

// ── Member Filter ─────────────────────────────────────────────────────────────
function MemberFilter({ members, selected, onChange, currentUserId }: {
  members: Pick<ApiMember, 'id' | 'name' | 'avatar'>[];
  selected: string[];
  onChange: (ids: string[]) => void;
  currentUserId: string;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' }}>
      {members.map((m) => {
        const active = selected.includes(m.id);
        const isSelf = m.id === currentUserId;
        return (
          <TouchableOpacity
            key={m.id}
            onPress={() => toggle(m.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? '#E0F2FE' : '#FFFFFF', borderWidth: 1.5, borderColor: active ? '#0EA5E9' : '#EDE8E1' }}
          >
            <Text style={{ fontSize: 16 }}>{m.avatar}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#0EA5E9' : '#8E9BAB' }}>
              {isSelf ? `${m.name} (Tôi)` : m.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
