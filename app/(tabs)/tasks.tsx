import { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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

// ── Add Task Modal ────────────────────────────────────────────────────────────
interface AddTaskModalProps {
  visible: boolean;
  availableTags: string[];
  assignableMembers: Pick<ApiMember, 'id' | 'name' | 'avatar'>[];
  defaultAssignees: string[];
  isParent: boolean;
  currentUserId: string;
  onClose: () => void;
  onAdd: (data: { title: string; note?: string; points?: number; tags?: string[]; autoApprove?: boolean; dueDate?: string; repeat?: string | null }, assigneeIds: string[]) => void;
  loading?: boolean;
}

const MONTH_NAMES_SHORT = ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'];
const DAY_LABELS_SHORT = ['CN','T2','T3','T4','T5','T6','T7'];

function InlineDatePicker({ value, onChange }: { value: Date | null; onChange: (d: Date | null) => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d: number) =>
    value !== null && d === value.getDate() && viewMonth === value.getMonth() && viewYear === value.getFullYear();
  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); };

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#0EA5E9', overflow: 'hidden', marginBottom: 12 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EFF9FF', paddingHorizontal: 12, paddingVertical: 8 }}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 18, color: '#8E9BAB' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#2D3A4A' }}>{MONTH_NAMES_SHORT[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 18, color: '#8E9BAB' }}>›</Text>
        </TouchableOpacity>
      </View>
      {/* Day labels */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 6 }}>
        {DAY_LABELS_SHORT.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#B0BAC7', fontWeight: '600' }}>{d}</Text>
          </View>
        ))}
      </View>
      {/* Grid */}
      <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              const sel = day !== null && isSelected(day);
              const tod = day !== null && isToday(day);
              return (
                <TouchableOpacity
                  key={col}
                  disabled={day === null}
                  onPress={() => {
                    if (!day) return;
                    const picked = new Date(viewYear, viewMonth, day);
                    onChange(sel ? null : picked);
                  }}
                  style={{ flex: 1, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: sel ? '#0EA5E9' : 'transparent' }}
                >
                  {day !== null && (
                    <>
                      <Text style={{ fontSize: 12, fontWeight: sel || tod ? '700' : '400', color: sel ? '#FFFFFF' : tod ? '#0EA5E9' : '#2D3A4A' }}>{day}</Text>
                      {tod && !sel && <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#0EA5E9', position: 'absolute', bottom: 2 }} />}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
      {/* Clear */}
      {value !== null && (
        <TouchableOpacity onPress={() => onChange(null)} style={{ alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EDE8E1' }}>
          <Text style={{ fontSize: 12, color: '#E11D48', fontWeight: '600' }}>Xoá ngày</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function AddTaskModal({ visible, availableTags, assignableMembers, defaultAssignees, isParent, currentUserId, onClose, onAdd, loading }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [points, setPoints] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>(defaultAssignees);
  const [autoApprove, setAutoApprove] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [repeat, setRepeat] = useState<string | null>(null);

  useEffect(() => { if (visible) setAssignees(defaultAssignees); }, [visible]);

  const reset = () => {
    setTitle(''); setNote(''); setPoints(''); setSelectedTags([]);
    setAutoApprove(false); setDueDate(null); setShowDatePicker(false); setRepeat(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleAdd = () => {
    if (!title.trim()) return;
    if (assignees.length === 0) { Alert.alert('Chọn người thực hiện', 'Vui lòng chọn ít nhất 1 thành viên.'); return; }
    onAdd(
      { title: title.trim(), note: note.trim() || undefined, points: points ? parseInt(points) : undefined, tags: selectedTags, autoApprove, dueDate: dueDate?.toISOString(), repeat },
      assignees,
    );
    reset();
  };

  const isSelfOnly = assignees.length === 1 && assignees[0] === currentUserId;

  const toggleTag = (tag: string) => setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);
  const toggleAssignee = (id: string) => setAssignees((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const REPEAT_OPTIONS = [
    { key: null, label: 'Không' },
    { key: 'daily', label: 'Ngày' },
    { key: 'weekly', label: 'Tuần' },
    { key: 'monthly', label: 'Tháng' },
  ];

  const formatDueDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  const fieldStyle = (active?: boolean) => ({
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: active ? '#0EA5E9' : '#EDE8E1',
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={handleClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <View style={{ backgroundColor: '#FDF6EE', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#EDE8E1', alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#2D3A4A', marginBottom: 14 }}>Thêm việc mới</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>

            {/* 1. Assignees */}
            {assignableMembers.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 8 }}>GIAO CHO</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {assignableMembers.map((m) => {
                    const active = assignees.includes(m.id);
                    return (
                      <TouchableOpacity key={m.id} onPress={() => toggleAssignee(m.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? '#E0F2FE' : '#FFFFFF', borderWidth: 1.5, borderColor: active ? '#0EA5E9' : '#EDE8E1' }}
                      >
                        <Text style={{ fontSize: 16 }}>{m.avatar}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#0EA5E9' : '#8E9BAB' }}>
                          {m.id === currentUserId ? `${m.name} (Tôi)` : m.name}
                        </Text>
                        {active && <Text style={{ fontSize: 10, color: '#0EA5E9', fontWeight: '700' }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 2. Tags */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 8 }}>TAGS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity key={tag} onPress={() => toggleTag(tag)}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: active ? '#E0F2FE' : '#FFFFFF', borderWidth: 1, borderColor: active ? '#0EA5E9' : '#EDE8E1' }}
                    >
                      <Text style={{ fontSize: 11, color: active ? '#0EA5E9' : '#8E9BAB', fontWeight: '600' }}>🏷 {tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Title */}
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 6 }}>TÊN CÔNG VIỆC *</Text>
              <TextInput
                value={title} onChangeText={setTitle}
                placeholder="Ví dụ: Dọn phòng, Làm bài tập..."
                placeholderTextColor="#B0BAC7"
                style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: title ? '#0EA5E9' : '#EDE8E1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontWeight: title ? '600' : '400', color: '#2D3A4A' }}
              />
            </View>

            {/* 4. Ngày hẹn + Lặp lại cùng hàng */}
            <View style={{ marginBottom: showDatePicker ? 0 : 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 6 }}>NGÀY HẸN · LẶP LẠI</Text>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setShowDatePicker((v) => !v)} style={{ ...fieldStyle(!!dueDate || showDatePicker), flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: dueDate ? '#0EA5E9' : '#B0BAC7' }}>
                    {dueDate ? `📅 ${formatDueDate(dueDate)}` : '📅 Ngày'}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#B0BAC7' }}>{showDatePicker ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {REPEAT_OPTIONS.map((opt) => (
                  <TouchableOpacity key={String(opt.key)} onPress={() => setRepeat(opt.key)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: repeat === opt.key ? '#8B5CF6' : '#FFFFFF', borderWidth: 1, borderColor: repeat === opt.key ? '#8B5CF6' : '#EDE8E1', alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '700', color: repeat === opt.key ? '#FFFFFF' : '#8E9BAB' }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Inline date picker */}
            {showDatePicker && (
              <View style={{ marginBottom: 10, marginTop: 8 }}>
                <InlineDatePicker
                  value={dueDate}
                  onChange={(d) => { setDueDate(d); if (d) setShowDatePicker(false); }}
                />
              </View>
            )}

            {/* 5. Điểm + Auto-approve (2 col), Ghi chú full width */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: isSelfOnly ? '#D0D5DD' : '#B0BAC7', letterSpacing: 0.5, marginBottom: 6 }}>ĐIỂM THƯỞNG</Text>
                <TextInput
                  value={isSelfOnly ? '' : points}
                  onChangeText={isSelfOnly ? undefined : setPoints}
                  editable={!isSelfOnly}
                  placeholder={isSelfOnly ? 'Không áp dụng' : '0'}
                  placeholderTextColor={isSelfOnly ? '#D0D5DD' : '#B0BAC7'}
                  keyboardType="numeric"
                  style={{ ...fieldStyle(!isSelfOnly && !!points), fontSize: 13, color: isSelfOnly ? '#D0D5DD' : (points ? '#15803D' : '#2D3A4A'), fontWeight: (!isSelfOnly && points) ? '600' : '400', backgroundColor: isSelfOnly ? '#F8FAFC' : '#FFFFFF' }}
                />
              </View>
              {isParent && (
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 6 }}>TỰ ĐỘNG DUYỆT</Text>
                  <TouchableOpacity
                    onPress={() => setAutoApprove((v) => !v)}
                    style={{ ...fieldStyle(autoApprove), flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: autoApprove ? '#F0FDF4' : '#FFFFFF', borderColor: autoApprove ? '#16A34A' : '#EDE8E1' }}
                  >
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: autoApprove ? '#16A34A' : '#EDE8E1', backgroundColor: autoApprove ? '#16A34A' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {autoApprove && <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: autoApprove ? '#16A34A' : '#8E9BAB' }}>Bật</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 6. Ghi chú */}
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 6 }}>GHI CHÚ</Text>
              <TextInput
                value={note} onChangeText={setNote}
                placeholder="Thêm ghi chú..."
                placeholderTextColor="#B0BAC7"
                style={{ ...fieldStyle(false), fontSize: 13, color: '#2D3A4A' }}
              />
            </View>

          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity onPress={handleClose} style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: '#EDE8E1', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#8E9BAB' }}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} disabled={loading || !title.trim()}
              style={{ flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: title.trim() ? '#0EA5E9' : '#E0F2FE', alignItems: 'center' }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: title.trim() ? '#FFFFFF' : '#93C5FD' }}>Thêm việc ✓</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
