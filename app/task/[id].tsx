import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type ApiTaskRow, type ApiMember } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { DEFAULT_TAGS } from '../../constants/mockData';

// ── Shared helpers (mirrors AddTaskModal) ────────────────────────────────────

const MONTH_NAMES_SHORT = ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'];
const DAY_LABELS_SHORT = ['CN','T2','T3','T4','T5','T6','T7'];

function fieldStyle(active?: boolean) {
  return {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: active ? '#0EA5E9' : '#EDE8E1',
  };
}

function formatDueDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EFF9FF', paddingHorizontal: 12, paddingVertical: 8 }}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 18, color: '#8E9BAB' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#2D3A4A' }}>{MONTH_NAMES_SHORT[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 18, color: '#8E9BAB' }}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 6 }}>
        {DAY_LABELS_SHORT.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#B0BAC7', fontWeight: '600' }}>{d}</Text>
          </View>
        ))}
      </View>
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
      {value !== null && (
        <TouchableOpacity onPress={() => onChange(null)} style={{ alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EDE8E1' }}>
          <Text style={{ fontSize: 12, color: '#E11D48', fontWeight: '600' }}>Xoá ngày</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const REPEAT_OPTIONS = [
  { key: null, label: 'Không' },
  { key: 'daily', label: 'Ngày' },
  { key: 'weekly', label: 'Tuần' },
  { key: 'monthly', label: 'Tháng' },
] as const;

// ── Screen ───────────────────────────────────────────────────────────────────

export default function TaskEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAppStore();
  const isParent = currentUser?.role === 'parent';

  const { familyId } = useAppStore();

  const { data: taskRows = [], isLoading } = useQuery<ApiTaskRow[]>({
    queryKey: ['tasks'],
    queryFn: () => api.task.list(),
    enabled: !!currentUser,
  });

  const { data: members = [] } = useQuery<ApiMember[]>({
    queryKey: ['members', familyId],
    queryFn: () => api.family.members(familyId!),
    enabled: !!familyId,
  });

  const row = taskRows.find((r) => r.task.id === id);
  const task = row?.task;

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [points, setPoints] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNote(task.note ?? '');
      setPoints(task.points > 0 ? String(task.points) : '');
      setTags(task.tags ?? []);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setAssignedTo(task.assignedTo);
      setDirty(false);
    }
  }, [task?.id]);

  const updateMutation = useMutation({
    mutationFn: (patch: Parameters<typeof api.task.update>[1]) => api.task.update(id!, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDirty(false);
      Alert.alert('Đã lưu', 'Cập nhật việc thành công.');
    },
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Thiếu tiêu đề'); return; }
    updateMutation.mutate({
      title: title.trim(),
      note: note.trim() || undefined,
      points: points ? Number(points) : 0,
      tags,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      assignedTo,
    });
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    setDirty(true);
  };

  const allTags = Array.from(new Set([...DEFAULT_TAGS, ...(task?.tags ?? [])]));

  const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
    pending:  { text: 'Chưa xong',  color: '#F59E0B', bg: '#FEF9C3' },
    done:     { text: 'Chờ duyệt',  color: '#F59E0B', bg: '#FEF3C7' },
    approved: { text: 'Đã duyệt',   color: '#16A34A', bg: '#F0FDF4' },
    expired:  { text: 'Hết hạn',    color: '#EF4444', bg: '#FEF2F2' },
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#0EA5E9" />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#8E9BAB' }}>Không tìm thấy việc.</Text>
      </SafeAreaView>
    );
  }

  const status = statusLabel[task.status] ?? statusLabel.pending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6EE' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE8E1', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#2D3A4A' }}>
          {isParent ? 'Chỉnh sửa việc' : 'Chi tiết việc'}
        </Text>
        {/* Assignee + status badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 20 }}>{row?.assignee?.avatar ?? '🧑'}</Text>
          <View style={{ backgroundColor: status.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: status.color }}>{status.text}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>

          {/* Assignee */}
          {isParent && members.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 8 }}>GIAO CHO</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {members.map((m) => {
                  const active = assignedTo === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => { setAssignedTo(m.id); setDirty(true); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? '#E0F2FE' : '#FFFFFF', borderWidth: 1.5, borderColor: active ? '#0EA5E9' : '#EDE8E1' }}
                    >
                      <Text style={{ fontSize: 16 }}>{m.avatar}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#0EA5E9' : '#8E9BAB' }}>
                        {m.id === currentUser?.id ? `${m.name} (Tôi)` : m.name}
                      </Text>
                      {active && <Text style={{ fontSize: 10, color: '#0EA5E9', fontWeight: '700' }}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Tags */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 8 }}>TAGS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {allTags.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => isParent && toggleTag(tag)}
                    style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: active ? '#E0F2FE' : '#FFFFFF', borderWidth: 1, borderColor: active ? '#0EA5E9' : '#EDE8E1' }}
                  >
                    <Text style={{ fontSize: 11, color: active ? '#0EA5E9' : '#8E9BAB', fontWeight: '600' }}>🏷 {tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Title */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 6 }}>TÊN CÔNG VIỆC *</Text>
            <TextInput
              value={title}
              onChangeText={(v) => { setTitle(v); setDirty(true); }}
              editable={isParent}
              placeholder="Tên công việc..."
              placeholderTextColor="#B0BAC7"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: title ? '#0EA5E9' : '#EDE8E1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontWeight: title ? '600' : '400', color: '#2D3A4A' }}
            />
          </View>

          {/* Due date */}
          <View style={{ marginBottom: showDatePicker ? 0 : 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 6 }}>NGÀY HẸN · LẶP LẠI</Text>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => isParent && setShowDatePicker((v) => !v)}
                style={{ ...fieldStyle(!!dueDate || showDatePicker), flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: dueDate ? '#0EA5E9' : '#B0BAC7' }}>
                  {dueDate ? `📅 ${formatDueDate(dueDate)}` : '📅 Ngày'}
                </Text>
                {isParent && <Text style={{ fontSize: 9, color: '#B0BAC7' }}>{showDatePicker ? '▲' : '▼'}</Text>}
              </TouchableOpacity>
              {/* Repeat — read-only display */}
              {REPEAT_OPTIONS.map((opt) => (
                <View
                  key={String(opt.key)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: task.repeat === opt.key ? '#8B5CF6' : '#FFFFFF', borderWidth: 1, borderColor: task.repeat === opt.key ? '#8B5CF6' : '#EDE8E1', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '700', color: task.repeat === opt.key ? '#FFFFFF' : '#8E9BAB' }}>{opt.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {showDatePicker && (
            <View style={{ marginBottom: 10, marginTop: 8 }}>
              <InlineDatePicker
                value={dueDate}
                onChange={(d) => { setDueDate(d); setDirty(true); if (d) setShowDatePicker(false); }}
              />
            </View>
          )}

          {/* Points */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 6 }}>ĐIỂM THƯỞNG</Text>
            <TextInput
              value={points}
              onChangeText={(v) => { setPoints(v.replace(/[^0-9]/g, '')); setDirty(true); }}
              editable={isParent}
              placeholder="0"
              placeholderTextColor="#B0BAC7"
              keyboardType="numeric"
              style={{ ...fieldStyle(!!points), fontSize: 13, color: points ? '#15803D' : '#2D3A4A', fontWeight: points ? '600' : '400' }}
            />
          </View>

          {/* Note */}
          <View style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#B0BAC7', letterSpacing: 0.5, marginBottom: 6 }}>GHI CHÚ</Text>
            <TextInput
              value={note}
              onChangeText={(v) => { setNote(v); setDirty(true); }}
              editable={isParent}
              multiline
              numberOfLines={3}
              placeholder="Thêm ghi chú..."
              placeholderTextColor="#B0BAC7"
              style={{ ...fieldStyle(false), fontSize: 13, color: '#2D3A4A', minHeight: 72, textAlignVertical: 'top' }}
            />
          </View>

        </ScrollView>

        {/* Bottom action buttons — mirrors AddTaskModal */}
        {isParent && (
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EDE8E1', backgroundColor: '#FDF6EE' }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: '#EDE8E1', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#8E9BAB' }}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={updateMutation.isPending || !dirty || !title.trim()}
              style={{ flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: (dirty && title.trim()) ? '#0EA5E9' : '#E0F2FE', alignItems: 'center' }}
            >
              {updateMutation.isPending
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={{ fontSize: 14, fontWeight: '700', color: (dirty && title.trim()) ? '#FFFFFF' : '#93C5FD' }}>Lưu thay đổi ✓</Text>}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
