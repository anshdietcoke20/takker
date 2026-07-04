import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  getPermissionState,
  openSettings,
  PermissionState,
  requestPermission,
} from '@/lib/notifications/setup';

export function useNotificationPermission() {
  const [permission, setPermission] = useState<PermissionState>('undetermined');

  useEffect(() => {
    const refresh = () => getPermissionState().then(setPermission);
    refresh();

    // there's no callback when the user flips the toggle in system settings, so re-check on resume
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, []);

  async function request() {
    setPermission(await requestPermission());
  }

  return { permission, request, openSettings };
}
