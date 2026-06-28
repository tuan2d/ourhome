import { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type ApiMember, type ApiTaskRow } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { DEFAULT_TAGS } from '../../constants/mockData';
import { RoleBadge } from '../../components/RoleBadge';

const STATUS_FILTERS = ['Tất cả', 'Chờ hoàn thành', 'Đã xong'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function Tasks() {
  const { currentUser, familyId, selectedMemberIds, setSelectedMembers } = useAppStore();
  const api = useApi();
  const queryClient = useQueryClient();
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

  const allChildren = members.filter((m) => m.role === 'child');

  // Filter task rows by target members
  const targetMemberIds = isParent
    ? (selectedMemberIds.length > 0 ? selectedMemberIds : allChildren.map((m) => m.id))
    : [currentUser.id];

  type DisplayTask = {
    id: string; title: string; done: boolean; tags: string[];
    points: number; memberId: string; memberName: string; memberAvatar: string;
    status: 'pending' | 'done' | 'approved';
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
        : allChildren.map((m) => m.name))
    : [currentUser.name];

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-muted">To-do list</Text>
          <Text className="text-2xl font-bold text-brand mt-0.5">Việc cần hoàn thành</Text>
        </View>
      </View>

      <RoleBadge />

      {/* Member filter (parent only) */}
      {isParent && allChildren.length > 0 && (
        <MemberFilter members={allChildren} selected={selectedMemberIds} onChange={setSelectedMembers} />
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
        assignableMembers={isParent ? allChildren : []}
        defaultAssignees={
          isParent
            ? (selectedMemberIds.length > 0 ? selectedMemberIds : allChildren.map((m) => m.id))
            : [currentUser.id]
        }
        isParent={isParent}
        onClose={() => setShowAdd(false)}
        onAdd={(taskData, assigneeIds) => createMutation.mutate({ ...taskData, assigneeIds })}
        loading={createMutation.isPending}
      />
    </SafeAreaView>
  );
}

// ── Member Filter ─────────────────────────────────────────────────────────────
function MemberFilter({ members, selected, onChange }: {
  members: Pick<ApiMember, 'id' | 'name' | 'avatar'>[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' }}>
      {members.map((m) => {
        const active = selected.includes(m.id);
        return (
          <TouchableOpacity
            key={m.id}
            onPress={() => toggle(m.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? '#E0F2FE' : '#FFFFFF', borderWidth: 1.5, borderColor: active ? '#0EA5E9' : '#EDE8E1' }}
          >
            <Text style={{ fontSize: 16 }}>{m.avatar}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#0EA5E9' : '#8E9BAB' }}>{m.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── Add Task Modal ────────────────────────────────────────────────────────────
interface AddTaskModalProps {
  visible: boolean;
  availableTags: string[];
  assignableMembers: Pick<ApiMember, 'id' | 'name' | 'avatar'>[];
  defaultAssignees: string[];
  isParent: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; note?: string; points?: number; tags?: string[]; autoApprove?: boolean }, assigneeIds: string[]) => void;
  loading?: boolean;
}

function AddTaskModal({ visible, availableTags, assignableMembers, defaultAssignees, isParent, onClose, onAdd, loading }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [points, setPoints] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>(defaultAssignees);
  const [autoApprove, setAutoApprove] = useState(false);

  useEffect(() => { if (visible) setAssignees(defaultAssignees); }, [visible]);

  const reset = () => { setTitle(''); setNote(''); setPoints(''); setSelectedTags([]); setAutoApprove(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleAdd = () => {
    if (!title.trim()) return;
    if (assignees.length === 0) { Alert.alert('Chọn người thực hiện', 'Vui lòng chọn ít nhất 1 thành viên.'); return; }
    onAdd(
      { title: title.trim(), note: note.trim() || undefined, points: points ? parseInt(points) : undefined, tags: selectedTags, autoApprove },
      assignees,
    );
    reset();
  };

  const toggleTag = (tag: string) => setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);
  const toggleAssignee = (id: string) => setAssignees((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={handleClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <View style={{ backgroundColor: '#FDF6EE', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#EDE8E1', alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#2D3A4A', marginBottom: 20 }}>Thêm việc mới</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
            {assignableMembers.length > 0 && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 8 }}>GIAO CHO</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {assignableMembers.map((m) => {
                    const active = assignees.includes(m.id);
                    return (
                      <TouchableOpacity key={m.id} onPress={() => toggleAssignee(m.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? '#E0F2FE' : '#FFFFFF', borderWidth: 1.5, borderColor: active ? '#0EA5E9' : '#EDE8E1' }}
                      >
                        <Text style={{ fontSize: 18 }}>{m.avatar}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#0EA5E9' : '#8E9BAB' }}>{m.name}</Text>
                        {active && <Text style={{ fontSize: 11, color: '#0EA5E9', fontWeight: '700' }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>TÊN CÔNG VIỆC *</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Ví dụ: Dọn phòng, Làm bài tập..." placeholderTextColor="#B0BAC7"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: title ? '#0EA5E9' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2D3A4A', marginBottom: 16 }} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>GHI CHÚ</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="Ghi chú thêm (không bắt buộc)..." placeholderTextColor="#B0BAC7"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2D3A4A', marginBottom: 16 }} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>ĐIỂM THƯỞNG</Text>
            <TextInput value={points} onChangeText={setPoints} placeholder="Số điểm (để trống nếu không có)" placeholderTextColor="#B0BAC7" keyboardType="numeric"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2D3A4A', marginBottom: 16 }} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 8 }}>TAGS</Text>
            {isParent && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 8 }}>TÙY CHỌN</Text>
                <TouchableOpacity
                  onPress={() => setAutoApprove((v) => !v)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: autoApprove ? '#F0FDF4' : '#FFFFFF', borderWidth: 1, borderColor: autoApprove ? '#16A34A' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: autoApprove ? '#16A34A' : '#EDE8E1', backgroundColor: autoApprove ? '#16A34A' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {autoApprove && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3A4A' }}>Không cần xác nhận</Text>
                    <Text style={{ fontSize: 12, color: '#8E9BAB', marginTop: 1 }}>Tự động duyệt khi con hoàn thành</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {availableTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <TouchableOpacity key={tag} onPress={() => toggleTag(tag)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? '#E0F2FE' : '#FFFFFF', borderWidth: 1, borderColor: active ? '#0EA5E9' : '#EDE8E1' }}
                  >
                    <Text style={{ fontSize: 12, color: active ? '#0EA5E9' : '#8E9BAB', fontWeight: '600' }}>🏷 {tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity onPress={handleClose} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#EDE8E1', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#8E9BAB' }}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} disabled={loading || !title.trim()}
              style={{ flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: title.trim() ? '#0EA5E9' : '#E0F2FE', alignItems: 'center' }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontSize: 15, fontWeight: '700', color: title.trim() ? '#FFFFFF' : '#93C5FD' }}>Thêm việc ✓</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
