import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useNotificationPermission } from '@/hooks/use-notification-permission';
import { useTheme } from '@/hooks/use-theme';

const STATUS_COPY: Record<string, { label: string; detail: string }> = {
  granted: {
    label: 'Granted',
    detail: 'Reminders and push notifications can be delivered.',
  },
  undetermined: {
    label: 'Not requested',
    detail: 'Grant permission so reminders can appear.',
  },
  denied: {
    label: 'Denied',
    detail: 'Notifications are blocked. Enable them in system settings to receive reminders.',
  },
};

export default function SettingsScreen() {
  const { permission, request, openSettings } = useNotificationPermission();
  const theme = useTheme();
  const copy = STATUS_COPY[permission];

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <ThemedText type="subtitle">Notifications</ThemedText>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          PERMISSION
        </ThemedText>
        <ThemedText type="default">{copy.label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {copy.detail}
        </ThemedText>
      </ThemedView>

      {permission === 'undetermined' && (
        <Pressable
          onPress={request}
          style={[styles.button, { backgroundColor: theme.text }]}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Enable notifications
          </ThemedText>
        </Pressable>
      )}

      {permission === 'denied' && (
        <Pressable
          onPress={openSettings}
          style={[styles.button, { backgroundColor: theme.text }]}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Open system settings
          </ThemedText>
        </Pressable>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        The app never crashes when permission is denied — habits are still saved, they just won&apos;t
        remind you until notifications are enabled.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  note: {
    paddingTop: Spacing.two,
  },
});
