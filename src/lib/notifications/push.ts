import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { ensureReminderChannel, requestPermission } from './setup';

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

// Returns the Expo push token for this device. Push tokens don't exist in Expo Go (SDK 53+) or on
// simulators, so we throw readable errors instead of letting a raw native failure bubble up.
export async function registerForPushNotificationsAsync(): Promise<string> {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device — simulators cannot register.');
  }

  await ensureReminderChannel();

  if ((await requestPermission()) !== 'granted') {
    throw new Error('Notification permission is required to receive push notifications.');
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('No EAS projectId found. Run `eas init` and rebuild the development build.');
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}
