import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type ApiScheduleItem, type ApiTimetableItem, type ApiMember } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { CalendarPicker } from '../../components/CalendarPicker';
import { RoleBadge } from '../../components/RoleBadge';

const WEEK_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEK_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
type SubTab = 'today' | 'timetable';

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Schedule() {
  const { currentUser, familyId, selectedMemberIds, setSelectedMembers } = useAppStore();
  const api = useApi();
  const queryClient = useQueryClient();
  const isParent = currentUser?.role === 'parent';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [subTab, setSubTab] = useState<SubTab>('today');
  const [showAdd, setShowAdd] = useState(false);

  const { data: members = [] } = useQuery<ApiMember[]>({
    queryKey: ['members', familyId],
    queryFn: () => api.family.members(familyId!),
    enabled: !!familyId,
  });

  const allChildren = members.filter((m) => m.role === 'child');
  const targetMemberIds = isParent
    ? (selectedMemberIds.length > 0 ? selectedMemberIds : allChildren.map((m) => m.id))
    : [currentUser?.id ?? ''];

  const dateStr = formatDate(selectedDate);
  const dayLabel = WEEK_SHORT[selectedDate.getDay()];

  const { data: schedules = [], isLoading: schedLoading } = useQuery<ApiScheduleItem[]>({
    queryKey: ['schedules', dateStr],
    queryFn: () => api.schedule.list(dateStr),
    enabled: !!currentUser,
  });

  const { data: timetable = [], isLoading: ttLoading } = useQuery<ApiTimetableItem[]>({
    queryKey: ['timetable'],
    queryFn: () => api.timetable.list(),
    enabled: !!currentUser,
  });

  const filteredSchedules = schedules.filter((s) => targetMemberIds.includes(s.userId));
  const filteredTimetable = timetable
    .filter((t) => targetMemberIds.includes(t.userId) && t.dayOfWeek === dayLabel)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const createScheduleMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.schedule.create>[0]) => api.schedule.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedules', dateStr] }); setShowAdd(false); },
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const createTimetableMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.timetable.create>[0]) => api.timetable.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timetable'] }); setShowAdd(false); },
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const getMemberInfo = (userId: string) => members.find((m) => m.id === userId);

  if (!currentUser) return null;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xs text-muted">Lịch biểu</Text>
        <Text className="text-2xl font-bold text-brand mt-0.5">Lịch hôm nay</Text>
      </View>

      <RoleBadge />

      {/* Member filter (parent only) */}
      {isParent && allChildren.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' }}>
          {allChildren.map((m) => {
            const active = selectedMemberIds.includes(m.id);
            return (
              <TouchableOpacity key={m.id} onPress={() => setSelectedMembers(active ? selectedMemberIds.filter((x) => x !== m.id) : [...selectedMemberIds, m.id])}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? '#E0F2FE' : '#FFFFFF', borderWidth: 1.5, borderColor: active ? '#0EA5E9' : '#EDE8E1' }}
              >
                <Text style={{ fontSize: 16 }}>{m.avatar}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#0EA5E9' : '#8E9BAB' }}>{m.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Calendar */}
      <CalendarPicker selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* Sub-tab */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#EDE8E1', borderRadius: 16, padding: 3 }}>
        {([{ key: 'today', label: 'Lịch hôm nay' }, { key: 'timetable', label: 'Thời khóa biểu' }] as { key: SubTab; label: string }[]).map(({ key, label }) => (
          <TouchableOpacity key={key} onPress={() => setSubTab(key)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 13, backgroundColor: subTab === key ? '#FFFFFF' : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: subTab === key ? '#0EA5E9' : '#8E9BAB' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {subTab === 'today' ? (
          <View className="mx-4 bg-surface border border-border rounded-3xl p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xs font-bold text-muted tracking-wider">LỊCH BIỂU — {dateStr}</Text>
            </View>
            {schedLoading ? (
              <ActivityIndicator color="#0EA5E9" style={{ paddingVertical: 24 }} />
            ) : filteredSchedules.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📅</Text>
                <Text style={{ fontSize: 14, color: '#8E9BAB' }}>Không có lịch nào</Text>
              </View>
            ) : (
              filteredSchedules
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((item, i) => {
                  const member = getMemberInfo(item.userId);
                  return (
                    <View key={item.id} style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: i < filteredSchedules.length - 1 ? 1 : 0, borderBottomColor: '#EDE8E1' }}>
                      <View style={{ backgroundColor: '#E0F2FE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginRight: 12, minWidth: 56, alignItems: 'center', alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0EA5E9' }}>{item.time}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        {isParent && member && (
                          <Text style={{ fontSize: 11, color: '#8E9BAB', marginBottom: 2 }}>{member.avatar} {member.name}</Text>
                        )}
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3A4A' }}>{item.title}</Text>
                        {item.note && <Text style={{ fontSize: 12, color: '#8E9BAB', marginTop: 2 }}>{item.note}</Text>}
                        {item.reminder && <Text style={{ fontSize: 11, color: '#F59E0B', marginTop: 2 }}>🔔 Nhắc nhở</Text>}
                      </View>
                    </View>
                  );
                })
            )}
          </View>
        ) : (
          <View className="mx-4">
            {ttLoading ? (
              <ActivityIndicator color="#0EA5E9" style={{ paddingVertical: 24 }} />
            ) : filteredTimetable.length === 0 ? (
              <View className="items-center py-12 bg-surface border border-border rounded-3xl">
                <Text className="text-4xl mb-3">📚</Text>
                <Text className="text-sm font-semibold text-brand">Không có lịch học</Text>
                <Text className="text-xs text-muted mt-1">Ngày {dayLabel} không có tiết học nào.</Text>
              </View>
            ) : (
              <View className="bg-surface border border-border rounded-3xl overflow-hidden">
                <View className="px-4 pt-4 pb-3 border-b border-border">
                  <Text className="text-xs font-bold text-muted tracking-wider">
                    THỜI KHÓA BIỂU — {dayLabel} {selectedDate.getDate()}/{selectedDate.getMonth() + 1}
                  </Text>
                </View>
                {filteredTimetable.map((item, i) => {
                  const member = getMemberInfo(item.userId);
                  return (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: i < filteredTimetable.length - 1 ? 1 : 0, borderBottomColor: '#EDE8E1' }}>
                      <View style={{ backgroundColor: '#E0F2FE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginRight: 12, minWidth: 56, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0EA5E9' }}>{item.startTime}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          {isParent && member && <Text style={{ fontSize: 14 }}>{member.avatar}</Text>}
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D3A4A' }}>{item.subject}</Text>
                        </View>
                        {(item.teacher || item.room) && (
                          <Text style={{ fontSize: 12, color: '#8E9BAB', marginTop: 2 }}>
                            {[item.teacher, item.room].filter(Boolean).join(' · ')}
                          </Text>
                        )}
                        {isParent && member && <Text style={{ fontSize: 11, color: '#B0BAC7', marginTop: 1 }}>{member.name}</Text>}
                      </View>
                      <Text style={{ fontSize: 16 }}>📖</Text>
                    </View>
                  );
                })}
              </View>
            )}
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

      <AddScheduleModal
        visible={showAdd}
        subTab={subTab}
        defaultDate={dateStr}
        defaultDayOfWeek={dayLabel}
        members={isParent ? members.filter((m) => m.role === 'child') : currentUser ? [{ id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }] : []}
        currentUserId={currentUser?.id ?? ''}
        isParent={isParent}
        weekDays={WEEK_DAYS}
        onClose={() => setShowAdd(false)}
        onAddSchedule={(data) => createScheduleMutation.mutate(data)}
        onAddTimetable={(data) => createTimetableMutation.mutate(data)}
        loading={createScheduleMutation.isPending || createTimetableMutation.isPending}
      />
    </SafeAreaView>
  );
}

// ── Add Schedule/Timetable Modal ──────────────────────────────────────────────
interface AddScheduleModalProps {
  visible: boolean;
  subTab: SubTab;
  defaultDate: string;
  defaultDayOfWeek: string;
  members: { id: string; name: string; avatar: string }[];
  currentUserId: string;
  isParent: boolean;
  weekDays: string[];
  onClose: () => void;
  onAddSchedule: (data: { title: string; time: string; date: string; note?: string; reminder?: boolean; userId?: string }) => void;
  onAddTimetable: (data: { subject: string; dayOfWeek: string; startTime: string; teacher?: string; room?: string; userId?: string }) => void;
  loading?: boolean;
}

function AddScheduleModal({ visible, subTab, defaultDate, defaultDayOfWeek, members, currentUserId, isParent, weekDays, onClose, onAddSchedule, onAddTimetable, loading }: AddScheduleModalProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [selectedDay, setSelectedDay] = useState(defaultDayOfWeek);
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);

  const reset = () => { setTitle(''); setTime(''); setNote(''); setTeacher(''); setRoom(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleAdd = () => {
    if (!title.trim() || !time.trim()) { Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và giờ.'); return; }
    if (subTab === 'today') {
      onAddSchedule({ title: title.trim(), time: time.trim(), date: defaultDate, note: note.trim() || undefined, userId: selectedUserId || undefined });
    } else {
      onAddTimetable({ subject: title.trim(), startTime: time.trim(), dayOfWeek: selectedDay, teacher: teacher.trim() || undefined, room: room.trim() || undefined, userId: selectedUserId || undefined });
    }
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={handleClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <View style={{ backgroundColor: '#FDF6EE', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#EDE8E1', alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#2D3A4A', marginBottom: 20 }}>
            {subTab === 'today' ? 'Thêm lịch' : 'Thêm vào TKB'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
            {isParent && members.length > 0 && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 8 }}>CHO THÀNH VIÊN</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {members.map((m) => (
                      <TouchableOpacity key={m.id} onPress={() => setSelectedUserId(m.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedUserId === m.id ? '#E0F2FE' : '#FFFFFF', borderWidth: 1.5, borderColor: selectedUserId === m.id ? '#0EA5E9' : '#EDE8E1' }}
                      >
                        <Text style={{ fontSize: 16 }}>{m.avatar}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: selectedUserId === m.id ? '#0EA5E9' : '#8E9BAB' }}>{m.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>
              {subTab === 'today' ? 'TIÊU ĐỀ *' : 'MÔN HỌC *'}
            </Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={subTab === 'today' ? 'Ví dụ: Học piano, Bơi lội...' : 'Ví dụ: Toán, Anh văn...'} placeholderTextColor="#B0BAC7"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: title ? '#0EA5E9' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2D3A4A', marginBottom: 16 }} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>GIỜ BẮT ĐẦU * (HH:MM)</Text>
            <TextInput value={time} onChangeText={setTime} placeholder="08:00" placeholderTextColor="#B0BAC7" keyboardType="numbers-and-punctuation"
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: time ? '#0EA5E9' : '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#2D3A4A', marginBottom: 16 }} />

            {subTab === 'timetable' ? (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 8 }}>THỨ</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {weekDays.map((d) => (
                    <TouchableOpacity key={d} onPress={() => setSelectedDay(d)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: selectedDay === d ? '#0EA5E9' : '#FFFFFF', borderWidth: 1.5, borderColor: selectedDay === d ? '#0EA5E9' : '#EDE8E1' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: selectedDay === d ? '#FFFFFF' : '#8E9BAB' }}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>GIÁO VIÊN</Text>
                <TextInput value={teacher} onChangeText={setTeacher} placeholder="Tên giáo viên (không bắt buộc)" placeholderTextColor="#B0BAC7"
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2D3A4A', marginBottom: 16 }} />

                <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>PHÒNG HỌC</Text>
                <TextInput value={room} onChangeText={setRoom} placeholder="Phòng học (không bắt buộc)" placeholderTextColor="#B0BAC7"
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2D3A4A', marginBottom: 16 }} />
              </>
            ) : (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E9BAB', marginBottom: 6 }}>GHI CHÚ</Text>
                <TextInput value={note} onChangeText={setNote} placeholder="Ghi chú thêm (không bắt buộc)" placeholderTextColor="#B0BAC7"
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2D3A4A', marginBottom: 16 }} />
              </>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity onPress={handleClose} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#EDE8E1', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#8E9BAB' }}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} disabled={loading || !title.trim() || !time.trim()}
              style={{ flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: title.trim() && time.trim() ? '#0EA5E9' : '#E0F2FE', alignItems: 'center' }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontSize: 15, fontWeight: '700', color: title.trim() && time.trim() ? '#FFFFFF' : '#93C5FD' }}>Thêm ✓</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
