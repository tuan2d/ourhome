import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import type { ApiMember } from '../services/api';

export interface AddTaskData {
  title: string;
  note?: string;
  points?: number;
  tags?: string[];
  dueDate?: string;
  repeat?: string | null;
}

export interface AddTaskModalProps {
  visible: boolean;
  availableTags: string[];
  assignableMembers: Pick<ApiMember, 'id' | 'name' | 'avatar'>[];
  defaultAssignees: string[];
  defaultDueDate?: Date | null;
  isParent: boolean;
  currentUserId: string;
  onClose: () => void;
  onAdd: (data: AddTaskData, assigneeIds: string[]) => void;
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

function formatDueDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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

export function AddTaskModal({
  visible, availableTags, assignableMembers, defaultAssignees,
  defaultDueDate, isParent, currentUserId, onClose, onAdd, loading,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [points, setPoints] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>(defaultAssignees);
  const [dueDate, setDueDate] = useState<Date | null>(defaultDueDate ?? null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [repeat, setRepeat] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setAssignees(defaultAssignees);
      setDueDate(defaultDueDate ?? null);
    }
  }, [visible]);

  const reset = () => {
    setTitle(''); setNote(''); setPoints(''); setSelectedTags([]);
    setDueDate(defaultDueDate ?? null); setShowDatePicker(false); setRepeat(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const isSelfOnly = assignees.length === 1 && assignees[0] === currentUserId;

  const toggleTag = (tag: string) => setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);
  const toggleAssignee = (id: string) => setAssignees((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleAdd = () => {
    if (!title.trim()) return;
    if (assignees.length === 0) { Alert.alert('Chọn người thực hiện', 'Vui lòng chọn ít nhất 1 thành viên.'); return; }
    onAdd(
      { title: title.trim(), note: note.trim() || undefined, points: (!isSelfOnly && points) ? parseInt(points) : undefined, tags: selectedTags, dueDate: dueDate?.toISOString(), repeat },
      assignees,
    );
    reset();
  };

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

            {showDatePicker && (
              <View style={{ marginBottom: 10, marginTop: 8 }}>
                <InlineDatePicker
                  value={dueDate}
                  onChange={(d) => { setDueDate(d); if (d) setShowDatePicker(false); }}
                />
              </View>
            )}

            {/* 5. Điểm */}
            <View style={{ marginBottom: 10 }}>
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
