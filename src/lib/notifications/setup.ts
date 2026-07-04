import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Linking, Platform } from 'react-native';

export const REMINDER_CHANNEL_ID = 'habit-reminders';

// Decides how a notification shows while the app is in the foreground. Without this,
// notifications that fire with the app open are silently dropped. Set once at import time.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Habit reminders',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#208AEF',
  });
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

function toState(status: Notifications.NotificationPermissionsStatus): PermissionState {
  if (status.granted) return 'granted';
  // a provisional grant on iOS still delivers (quietly), so treat it as granted
  if (status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

export async function getPermissionState(): Promise<PermissionState> {
  return toState(await Notifications.getPermissionsAsync());
}

export async function requestPermission(): Promise<PermissionState> {
  // channel first — see the README on why the Android channel has to exist before we ask
  await ensureReminderChannel();
  return toState(await Notifications.requestPermissionsAsync());
}

export function openSettings(): Promise<void> {
  return Linking.openSettings();
}
