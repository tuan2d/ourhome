import '../global.css';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, Redirect } from 'expo-router';
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
  const logout = useAppStore((s) => s.logout);
  const { currentUser, familyId } = useAppStore();

  usePushNotifications();

  useEffect(() => {
    if (!isSignedIn) {
      logout();
      return;
    }
    api.user.me().then((u) => {
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
      useAppStore.setState({ currentUser: member, familyId: u.familyId ?? null });
    }).catch(() => {
      logout();
    });
  }, [isSignedIn]);

  if (!isLoaded) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/sign-in" />
        <Stack.Screen name="(auth)/sign-up" />
        <Stack.Screen name="(onboarding)/family-setup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tags" />
      </Stack>
      {!isSignedIn && <Redirect href="/(auth)/sign-in" />}
      {isSignedIn && currentUser && !familyId && <Redirect href="/(onboarding)/family-setup" />}
    </>
  );
}
