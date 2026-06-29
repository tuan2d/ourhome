import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type ApiTaskRow } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { DEFAULT_TAGS } from '../../constants/mockData';
import { CalendarPicker } from '../../components/CalendarPicker';

const REPEAT_OPTIONS = [
  { value: null, label: 'Không lặp' },
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'monthly', label: 'Hàng tháng' },
] as const;

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAppStore();
  const isParent = currentUser?.role === 'parent';

  const { data: taskRows = [], isLoading } = useQuery<ApiTaskRow[]>({
    queryKey: ['tasks'],
    queryFn: () => api.task.list(),
    enabled: !!currentUser,
  });

  const row = taskRows.find((r) => r.task.id === id);
  const task = row?.task;

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [points, setPoints] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [calExpanded, setCalExpanded] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNote(task.note ?? '');
      setPoints(task.points > 0 ? String(task.points) : '');
      setTags(task.tags ?? []);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    }
  }, [task?.id]);

  const updateMutation = useMutation({
    mutationFn: (patch: Parameters<typeof api.task.update>[1]) =>
      api.task.update(id!, patch),
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
    });
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    setDirty(true);
  };

  const allTags = Array.from(new Set([...DEFAULT_TAGS, ...(task?.tags ?? [])]));

  const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
    pending: { text: 'Chờ hoàn thành', color: '#F59E0B', bg: '#FEF9C3' },
    done:    { text: 'Chờ duyệt',      color: '#F59E0B', bg: '#FEF3C7' },
    approved:{ text: 'Đã duyệt',       color: '#16A34A', bg: '#F0FDF4' },
    expired: { text: 'Hết hạn',        color: '#EF4444', bg: '#FEF2F2' },
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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: '#2D3A4A' }}>Chi tiết việc</Text>
        {isParent && dirty && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateMutation.isPending}
            style={{ backgroundColor: '#0EA5E9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            {updateMutation.isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Lưu</Text>}
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Assignee + status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Text style={{ fontSize: 28 }}>{row?.assignee?.avatar ?? '🧑'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#2D3A4A' }}>{row?.assignee?.name ?? '—'}</Text>
            </View>
            <View style={{ backgroundColor: status.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: status.color }}>{status.text}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>TIÊU ĐỀ</Text>
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); setDirty(true); }}
            editable={isParent}
            style={{
              backgroundColor: '#FFFFFF', borderWidth: 1,
              borderColor: isParent && title ? '#0EA5E9' : '#EDE8E1',
              borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
              fontSize: 15, color: '#2D3A4A', marginBottom: 16,
            }}
          />

          {/* Tags */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 8 }}>TAG</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {allTags.map((tag) => {
              const active = tags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => isParent && toggleTag(tag)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                    backgroundColor: active ? '#E0F2FE' : '#FFFFFF',
                    borderWidth: 1.5, borderColor: active ? '#0EA5E9' : '#EDE8E1',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#0EA5E9' : '#8E9BAB' }}>🏷 {tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Due date */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 8 }}>NGÀY HẸN</Text>
          {isParent ? (
            <View style={{ marginBottom: 16 }}>
              <CalendarPicker
                selectedDate={dueDate ?? new Date()}
                onSelect={(d) => { setDueDate(d); setDirty(true); }}
                expanded={calExpanded}
                onToggleExpand={() => setCalExpanded((v) => !v)}
              />
              {dueDate && (
                <TouchableOpacity onPress={() => { setDueDate(null); setDirty(true); }} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 12, color: '#EF4444' }}>✕ Xoá ngày hẹn</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={{ fontSize: 14, color: '#2D3A4A', marginBottom: 16 }}>
              {dueDate ? dueDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Không có ngày hẹn'}
            </Text>
          )}

          {/* Points */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>ĐIỂM THƯỞNG</Text>
          <TextInput
            value={points}
            onChangeText={(v) => { setPoints(v.replace(/[^0-9]/g, '')); setDirty(true); }}
            editable={isParent}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#B0BAC7"
            style={{
              backgroundColor: '#FFFFFF', borderWidth: 1,
              borderColor: '#EDE8E1', borderRadius: 14,
              paddingHorizontal: 14, paddingVertical: 12,
              fontSize: 15, color: '#2D3A4A', marginBottom: 16,
            }}
          />

          {/* Note */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>GHI CHÚ</Text>
          <TextInput
            value={note}
            onChangeText={(v) => { setNote(v); setDirty(true); }}
            editable={isParent}
            multiline
            numberOfLines={3}
            placeholder="Không có ghi chú"
            placeholderTextColor="#B0BAC7"
            style={{
              backgroundColor: '#FFFFFF', borderWidth: 1,
              borderColor: '#EDE8E1', borderRadius: 14,
              paddingHorizontal: 14, paddingVertical: 12,
              fontSize: 14, color: '#2D3A4A', marginBottom: 24,
              minHeight: 80, textAlignVertical: 'top',
            }}
          />

          {/* Save button (bottom, for convenience) */}
          {isParent && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={updateMutation.isPending || !dirty}
              style={{
                backgroundColor: dirty ? '#0EA5E9' : '#E0F2FE',
                borderRadius: 16, paddingVertical: 16, alignItems: 'center',
              }}
            >
              {updateMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ fontSize: 16, fontWeight: '700', color: dirty ? '#FFFFFF' : '#93C5FD' }}>Lưu thay đổi</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
