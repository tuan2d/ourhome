import '../global.css';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { tokenCache } from '../lib/tokenCache';
import { useApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { usePushNotifications } from '../lib/usePushNotifications';
import type { FamilyMember } from '../constants/mockData';

if (typeof StyleSheet.setFlag === 'function') {
  StyleSheet.setFlag('darkMode', 'class');
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AuthGate />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function AuthGate() {
  const { isSignedIn, isLoaded } = useAuth();
  const api = useApi();
  const router = useRouter();
  const logout = useAppStore((s) => s.logout);
  const { currentUser, familyId } = useAppStore();

  usePushNotifications();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      logout();
      router.replace('/(auth)/sign-in');
      return;
    }
    api.user.me().then(async (u) => {
      const member: FamilyMember = {
        id: u.id,
        name: u.name,
        avatar: u.avatar ?? '🧑',
        role: u.role,
        totalPoints: u.totalPoints ?? 0,
        weeklyPoints: u.weeklyPoints ?? 0,
        focusBadge: u.focusBadge ?? '',
        tasks: [],
        timeline: [],
        timetable: [],
        bars: [],
        rewards: [],
        goals: [],
      };

      let familyName: string | null = null;
      if (u.familyId) {
        try {
          const family = await api.family.mine();
          familyName = family.name;
        } catch {}
      }

      useAppStore.setState({ currentUser: member, familyId: u.familyId ?? null, familyName });

      if (!u.familyId) {
        router.replace('/(onboarding)/family-setup');
      }
    }).catch(() => {
      logout();
      router.replace('/(auth)/sign-in');
    });
  }, [isSignedIn, isLoaded]);

  if (!isLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/sign-in" />
      <Stack.Screen name="(auth)/sign-up" />
      <Stack.Screen name="(onboarding)/family-setup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="tags" />
    </Stack>
  );
}
