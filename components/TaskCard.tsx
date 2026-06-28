import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Task } from '../constants/mockData';

function pad(n: number) { return String(n).padStart(2, '0'); }

interface Props {
  task: Task;
  onToggle?: (id: string) => void;
  showMember?: boolean;
  memberName?: string;
  memberAvatar?: string;
}

export function TaskCard({ task, onToggle, showMember, memberName, memberAvatar }: Props) {
  const [reminderOn, setReminderOn] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: '#EDE8E1', paddingVertical: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggle?.(task.id)}
          style={{
            width: 26, height: 26, borderRadius: 13, borderWidth: 2,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: task.done ? '#0EA5E9' : '#FFFFFF',
            borderColor: task.done ? '#0EA5E9' : '#EDE8E1',
          }}
        >
          {task.done && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>✓</Text>}
        </TouchableOpacity>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {showMember && memberName && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
              <Text style={{ fontSize: 13 }}>{memberAvatar}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#8E9BAB' }}>{memberName}</Text>
            </View>
          )}
          <Text style={{ fontSize: 14, fontWeight: '500', color: task.done ? '#8E9BAB' : '#2D3A4A', textDecorationLine: task.done ? 'line-through' : 'none' }}>
            {task.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {task.tags?.map((tag) => (
              <View key={tag} style={{ backgroundColor: '#E0F2FE', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, color: '#0EA5E9', fontWeight: '600' }}>{tag}</Text>
              </View>
            ))}
            <Text style={{ fontSize: 11, color: task.done ? '#0EA5E9' : '#8E9BAB', fontWeight: '600', marginLeft: 2 }}>
              {task.meta}
            </Text>
          </View>
        </View>

        {/* Bell toggle */}
        {!task.done && (
          <TouchableOpacity
            onPress={() => setReminderOn(v => !v)}
            style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: reminderOn ? '#FFF7ED' : '#F5F5F5', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 13 }}>{reminderOn ? '🔔' : '🔕'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Compact reminder time row */}
      {reminderOn && !task.done && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginLeft: 36 }}>
          <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '600' }}>🔔 Nhắc lúc</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 6, paddingVertical: 2, gap: 4 }}>
            <TouchableOpacity onPress={() => setHour(h => h < 23 ? h + 1 : 0)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
              <Text style={{ fontSize: 10, color: '#F59E0B' }}>▲</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E', minWidth: 20, textAlign: 'center' }}>{pad(hour)}</Text>
            <TouchableOpacity onPress={() => setHour(h => h > 0 ? h - 1 : 23)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
              <Text style={{ fontSize: 10, color: '#F59E0B' }}>▼</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#F59E0B' }}>:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 6, paddingVertical: 2, gap: 4 }}>
            <TouchableOpacity onPress={() => setMinute(m => m < 59 ? m + 1 : 0)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
              <Text style={{ fontSize: 10, color: '#F59E0B' }}>▲</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E', minWidth: 20, textAlign: 'center' }}>{pad(minute)}</Text>
            <TouchableOpacity onPress={() => setMinute(m => m > 0 ? m - 1 : 59)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
              <Text style={{ fontSize: 10, color: '#F59E0B' }}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
