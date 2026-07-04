import { useEffect, useState } from 'react';

import { registerForPushNotificationsAsync } from '@/lib/notifications/push';

type Status = 'idle' | 'registering' | 'ready' | 'error';

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  async function register() {
    setStatus('registering');
    setError(null);
    try {
      setToken(await registerForPushNotificationsAsync());
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not register for push notifications.');
      setStatus('error');
    }
  }

  // try once when the Push tab opens; the button lets the user retry after fixing a permission/dev build
  useEffect(() => {
    register();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { token, error, status, register };
}
