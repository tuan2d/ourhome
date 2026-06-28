import { View, Text, TouchableOpacity } from 'react-native';

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const MONTH_NAMES = [
  'Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6',
  'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12',
];

interface Props {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

export function CalendarPicker({ selectedDate, onSelect }: Props) {
  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d: number) =>
    d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EDE8E1', paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 16, marginBottom: 10 }}>
      {/* Month nav */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => onSelect(new Date(year, month - 1, 1))} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: '#8E9BAB' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#2D3A4A' }}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={() => onSelect(new Date(year, month + 1, 1))} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: '#8E9BAB' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={{ flexDirection: 'row', marginBottom: 2 }}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#8E9BAB', fontWeight: '600' }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            const sel = day !== null && isSelected(day);
            const tod = day !== null && isToday(day);
            return (
              <TouchableOpacity
                key={col}
                onPress={() => day && onSelect(new Date(year, month, day))}
                disabled={day === null}
                style={{ flex: 1, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: sel ? '#0EA5E9' : 'transparent' }}
              >
                {day !== null && (
                  <>
                    <Text style={{ fontSize: 12, fontWeight: sel || tod ? '700' : '400', color: sel ? '#FFFFFF' : tod ? '#0EA5E9' : '#2D3A4A' }}>
                      {day}
                    </Text>
                    {tod && !sel && (
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#0EA5E9', position: 'absolute', bottom: 2 }} />
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
