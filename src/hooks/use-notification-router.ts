import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { NotificationRoute } from '@/lib/notifications/schedule';

function parseRoute(data: unknown): NotificationRoute | null {
  const route = data as NotificationRoute | undefined;
  if (route && route.screen === '/habit' && typeof route.habitId === 'string') {
    return route;
  }
  return null;
}

// One handler for every notification tap, local or push. A cold start (app launched by the tap) comes
// through getLastNotificationResponseAsync; taps while the app is alive come through the listener.
// Mount this once at the root, above the navigator.
export function useNotificationRouter() {
  const router = useRouter();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    function open(response: Notifications.NotificationResponse | null) {
      if (!response) return;

      // both paths can deliver the same tap, so guard against navigating twice
      const id = response.notification.request.identifier;
      if (handled.current.has(id)) return;
      handled.current.add(id);

      const route = parseRoute(response.notification.request.content.data);
      if (!route) return; // missing/garbled payload — better to do nothing than jump somewhere wrong

      router.push({ pathname: '/habit/[id]', params: { id: route.habitId } });
    }

    Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [router]);
}
