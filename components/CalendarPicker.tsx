import { View, Text, TouchableOpacity } from 'react-native';

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

interface Props {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  markedDates?: Set<string>; // 'YYYY-MM-DD' strings
}

export function CalendarPicker({ selectedDate, onSelect, expanded, onToggleExpand, markedDates }: Props) {
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
  const isMarked = (d: number) => {
    if (!markedDates) return false;
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return markedDates.has(key);
  };

  // Find the row index containing selectedDate
  const selectedIndex = firstDay + selectedDate.getDate() - 1;
  const selectedRow = Math.floor(selectedIndex / 7);

  const rows = Array.from({ length: cells.length / 7 }, (_, row) => row);
  const visibleRows = expanded ? rows : rows.filter((row) => row === selectedRow);

  const handlePrevMonth = () => onSelect(new Date(year, month - 1, selectedDate.getDate()));
  const handleNextMonth = () => onSelect(new Date(year, month + 1, selectedDate.getDate()));

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EDE8E1', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, marginHorizontal: 16, marginBottom: 10 }}>
      {/* Month nav + toggle */}
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}
      >
        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); handlePrevMonth(); }} style={{ padding: 4 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 16, color: '#8E9BAB' }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2D3A4A' }}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <Text style={{ fontSize: 11, color: '#0EA5E9', fontWeight: '600' }}>
            {expanded ? '▲' : '▼'}
          </Text>
        </View>
        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); handleNextMonth(); }} style={{ padding: 4 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 16, color: '#8E9BAB' }}>›</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Day labels */}
      <View style={{ flexDirection: 'row', marginBottom: 2 }}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#8E9BAB', fontWeight: '600' }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid rows */}
      {visibleRows.map((row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            const sel = day !== null && isSelected(day);
            const tod = day !== null && isToday(day);
            return (
              <TouchableOpacity
                key={col}
                onPress={() => day && onSelect(new Date(year, month, day))}
                disabled={day === null}
                style={{ flex: 1, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: sel ? '#0EA5E9' : 'transparent' }}
              >
                {day !== null && (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: sel || tod ? '700' : '400', color: sel ? '#FFFFFF' : tod ? '#0EA5E9' : '#2D3A4A' }}>
                      {day}
                    </Text>
                    {(tod && !sel) && (
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#0EA5E9', position: 'absolute', bottom: 2 }} />
                    )}
                    {isMarked(day) && !sel && (
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#F59E0B', position: 'absolute', bottom: 2 }} />
                    )}
                    {isMarked(day) && sel && (
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)', position: 'absolute', bottom: 2 }} />
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
