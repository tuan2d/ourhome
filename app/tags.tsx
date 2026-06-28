import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_TAGS } from '../constants/mockData';

const TAG_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
const STORAGE_KEY = '@ourhome_tags';

export default function Tags() {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setTags(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const saveTags = useCallback((next: string[]) => {
    setTags(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      Alert.alert('Tag đã tồn tại', `"${trimmed}" đã có trong danh sách.`);
      return;
    }
    saveTags([...tags, trimmed]);
    setNewTag('');
  };

  const deleteTag = (tag: string) => {
    Alert.alert('Xoá tag', `Xoá "${tag}"? Các task đang dùng tag này sẽ không bị ảnh hưởng.`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => saveTags(tags.filter((t) => t !== tag)) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE8E1', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-xs text-muted">Cài đặt</Text>
          <Text className="text-xl font-bold text-brand">Quản lý tag</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Add new tag */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#EDE8E1',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', marginBottom: 10, letterSpacing: 0.5 }}>
            THÊM TAG MỚI
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={addTag}
              placeholder="Tên tag..."
              placeholderTextColor="#B0BAC7"
              returnKeyType="done"
              style={{
                flex: 1,
                backgroundColor: '#F9FAFB',
                borderWidth: 1,
                borderColor: '#EDE8E1',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
                color: '#2D3A4A',
              }}
            />
            <TouchableOpacity
              onPress={addTag}
              style={{
                backgroundColor: '#0EA5E9',
                borderRadius: 12,
                paddingHorizontal: 16,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tag list */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#EDE8E1',
            overflow: 'hidden',
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#EDE8E1' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E9BAB', letterSpacing: 0.5 }}>
              DANH SÁCH TAG ({tags.length})
            </Text>
          </View>

          {tags.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🏷</Text>
              <Text style={{ color: '#8E9BAB', fontSize: 14 }}>Chưa có tag nào</Text>
            </View>
          ) : (
            tags.map((tag, i) => {
              const color = TAG_COLORS[i % TAG_COLORS.length];
              return (
                <View
                  key={tag}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderBottomWidth: i < tags.length - 1 ? 1 : 0,
                    borderBottomColor: '#EDE8E1',
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>🏷</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: '#2D3A4A', fontWeight: '500' }}>{tag}</Text>
                  <View
                    style={{
                      backgroundColor: color + '15',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ fontSize: 11, color, fontWeight: '600' }}>{color}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteTag(tag)}>
                    <Text style={{ fontSize: 18, color: '#D1D5DB' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <Text style={{ textAlign: 'center', color: '#B0BAC7', fontSize: 12, marginTop: 16 }}>
          Tag giúp lọc và phân loại công việc nhanh hơn.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
