import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import type { FamilyMember } from '../constants/mockData';

interface Props {
  members: FamilyMember[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function MemberFilter({ members, selected, onChange }: Props) {
  const allSelected = selected.length === 0;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' }}
    >
      {/* All chip */}
      <TouchableOpacity
        onPress={() => onChange([])}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: allSelected ? '#2D3A4A' : '#FFFFFF',
          borderWidth: 1,
          borderColor: allSelected ? '#2D3A4A' : '#EDE8E1',
        }}
      >
        <Text style={{ fontSize: 13 }}>👨‍👩‍👧‍👦</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: allSelected ? '#FFFFFF' : '#8E9BAB' }}>Tất cả</Text>
      </TouchableOpacity>

      {members.map((m) => {
        const active = selected.includes(m.id);
        return (
          <TouchableOpacity
            key={m.id}
            onPress={() => toggle(m.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: active ? '#E0F2FE' : '#FFFFFF',
              borderWidth: 1.5,
              borderColor: active ? '#0EA5E9' : '#EDE8E1',
            }}
          >
            <Text style={{ fontSize: 16 }}>{m.avatar}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#0EA5E9' : '#8E9BAB' }}>{m.name}</Text>
            {active && (
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: '700' }}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
