import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { TimelineItem as TItem } from '../constants/mockData';

function pad(n: number) { return String(n).padStart(2, '0'); }

interface Props {
  item: TItem;
  isLast?: boolean;
}

export function TimelineItem({ item, isLast }: Props) {
  const [reminderOn, setReminderOn] = useState(item.reminder ?? false);
  const [hour, setHour] = useState(() => parseInt((item.time ?? '08:00').split(':')[0]));
  const [minute, setMinute] = useState(() => parseInt((item.time ?? '08:00').split(':')[1]));

  return (
    <View className={`flex-row gap-3 ${isLast ? 'mb-0' : 'mb-3 pb-3 border-b border-border'}`}>
      <View className="items-center">
        <View className="bg-accent-light rounded-full px-2 py-1">
          <Text className="text-xs font-semibold text-accent">{item.time}</Text>
        </View>
        {!isLast && <View className="w-px flex-1 bg-border mt-1" />}
      </View>

      <View className="flex-1 pb-1">
        <Text className="text-sm font-semibold text-brand">{item.title}</Text>
        <Text className="text-xs text-muted mt-0.5">{item.note}</Text>

        {/* Compact reminder row */}
        {reminderOn && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '600' }}>🔔 Nhắc lúc</Text>

            {/* Hour spinner */}
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

            {/* Minute spinner */}
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

      {/* Bell toggle */}
      <TouchableOpacity
        onPress={() => setReminderOn(v => !v)}
        style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: reminderOn ? '#FFF7ED' : '#F5F5F5', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginTop: 2 }}
      >
        <Text style={{ fontSize: 14 }}>{reminderOn ? '🔔' : '🔕'}</Text>
      </TouchableOpacity>
    </View>
  );
}
