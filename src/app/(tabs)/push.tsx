import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useTheme } from '@/hooks/use-theme';

export default function PushScreen() {
  const { token, error, status, register } = usePushNotifications();
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  async function copyToken() {
    if (!token) {
      return;
    }
    await Clipboard.setStringAsync(token);
    setCopied(true);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <ThemedText type="subtitle">Push token</ThemedText>
      <ThemedText themeColor="textSecondary" type="small">
        A server sends push notifications to this device using its Expo push token. Push requires a
        development build on a physical device — it does not work in Expo Go.
      </ThemedText>

      {status === 'registering' && (
        <ThemedText type="small" themeColor="textSecondary">
          Registering…
        </ThemedText>
      )}

      {token && (
        <ThemedView type="backgroundElement" style={styles.tokenCard}>
          <ThemedText type="code" selectable>
            {token}
          </ThemedText>
        </ThemedView>
      )}

      {token && (
        <Pressable
          onPress={copyToken}
          style={[styles.button, { backgroundColor: theme.text }]}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            {copied ? 'Copied ✓' : 'Copy token'}
          </ThemedText>
        </Pressable>
      )}

      {status === 'error' && (
        <ThemedView type="backgroundElement" style={styles.errorCard}>
          <ThemedText type="smallBold" style={{ color: '#e5484d' }}>
            Could not get a push token
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
          <Pressable
            onPress={register}
            style={[styles.button, { backgroundColor: theme.text, alignSelf: 'flex-start' }]}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              Try again
            </ThemedText>
          </Pressable>
        </ThemedView>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        Send a test push from expo.dev/notifications, a cURL request, or the Node script in{' '}
        <ThemedText type="code">server/</ThemedText>. Include{' '}
        <ThemedText type="code">{'data: { screen: "/habit", habitId }'}</ThemedText> to deep-link
        into a habit.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  tokenCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  errorCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  hint: {
    paddingTop: Spacing.two,
  },
});
