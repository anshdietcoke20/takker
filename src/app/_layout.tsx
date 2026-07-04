import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useNotificationRouter } from '@/hooks/use-notification-router';
import { ensureReminderChannel } from '@/lib/notifications/setup';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useNotificationRouter();

  // create the reminder channel up front so it's there before anything gets scheduled
  useEffect(() => {
    ensureReminderChannel();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="habit/[id]" options={{ title: 'Habit' }} />
        <Stack.Screen name="new" options={{ presentation: 'modal', title: 'New habit' }} />
      </Stack>
    </ThemeProvider>
  );
}
