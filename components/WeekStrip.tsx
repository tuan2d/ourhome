import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { WEEK_DAYS } from '../constants/mockData';

export function WeekStrip() {
  const { selectedDate, setSelectedDate } = useAppStore();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4">
      <View className="flex-row gap-2">
        {WEEK_DAYS.map((day) => {
          const active = day.date === selectedDate;
          return (
            <TouchableOpacity
              key={day.date}
              onPress={() => setSelectedDate(day.date)}
              className={`w-12 h-16 rounded-2xl items-center justify-center ${active ? 'bg-accent' : 'bg-surface border border-border'}`}
            >
              <Text className={`text-xs ${active ? 'text-white' : 'text-muted'}`}>{day.label}</Text>
              <Text className={`text-base font-bold mt-1 ${active ? 'text-white' : 'text-brand'}`}>{day.date}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
