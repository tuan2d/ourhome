import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 26, opacity: focused ? 1 : 0.35, marginBottom: -2 }}>
      {icon}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0EA5E9',
        tabBarInactiveTintColor: '#8E9BAB',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EDE8E1',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: { paddingTop: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="report"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Việc làm',
          tabBarIcon: ({ focused }) => <TabIcon icon="✅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Lịch',
          tabBarIcon: ({ focused }) => <TabIcon icon="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Thưởng',
          tabBarIcon: ({ focused }) => <TabIcon icon="🎁" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
