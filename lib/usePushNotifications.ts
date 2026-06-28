import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useApi } from '../services/api';

export function usePushNotifications() {
  const api = useApi();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    registerAndSaveToken(api.user.savePushToken);
  }, []);
}

async function registerAndSaveToken(saveFn: (token: string) => Promise<unknown>) {
  try {
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'OurHome',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await saveFn(tokenData.data);
  } catch {
    // Non-fatal: push is optional
  }
}
