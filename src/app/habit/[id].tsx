import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useHabit, useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { describeFrequency } from '@/lib/habits/format';
import { currentStreak, isDoneToday } from '@/lib/habits/streak';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loaded, markDone, deleteHabit } = useHabits();
  const habit = useHabit(id);
  const router = useRouter();
  const theme = useTheme();

  // A notification can deep-link here with an id whose habit was deleted; show a graceful state, not a crash.
  if (!habit) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Habit not found</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centeredText}>
          {loaded
            ? 'This habit may have been deleted.'
            : 'Loading…'}
        </ThemedText>
        <Pressable onPress={() => router.replace('/')} style={styles.linkButton}>
          <ThemedText type="linkPrimary">Back to Today</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const done = isDoneToday(habit);
  const streak = currentStreak(habit);

  function confirmDelete() {
    Alert.alert('Delete habit', `Delete “${habit!.name}” and cancel its reminders?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteHabit(habit!.id);
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.emoji}>{habit.emoji}</ThemedText>
        <ThemedText type="title" style={styles.name}>
          {habit.name}
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          REMINDER
        </ThemedText>
        <ThemedText type="default">{describeFrequency(habit.frequency)}</ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="small" themeColor="textSecondary">
          STREAK
        </ThemedText>
        <ThemedText type="default">
          {streak > 0 ? `🔥 ${streak} day${streak === 1 ? '' : 's'}` : 'No active streak'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {habit.lastCompletedISO
            ? `Last completed ${habit.lastCompletedISO}`
            : 'Not completed yet'}
        </ThemedText>
      </ThemedView>

      <Pressable
        onPress={() => markDone(habit.id)}
        disabled={done}
        style={[
          styles.primaryButton,
          { backgroundColor: done ? theme.backgroundSelected : theme.text },
        ]}>
        <ThemedText
          type="smallBold"
          style={{ color: done ? theme.textSecondary : theme.background }}>
          {done ? 'Completed today ✓' : 'Mark done for today'}
        </ThemedText>
      </Pressable>

      <ThemedView style={styles.secondaryRow}>
        <Pressable
          onPress={() => router.push({ pathname: '/new', params: { id: habit.id } })}
          style={[styles.secondaryButton, { borderColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">Edit</ThemedText>
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          style={[styles.secondaryButton, { borderColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" style={{ color: '#e5484d' }}>
            Delete
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedText type="small" themeColor="textSecondary" style={styles.idHint}>
        Habit id: {habit.id}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  emoji: {
    fontSize: 64,
  },
  name: {
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 38,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
  primaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centeredText: {
    textAlign: 'center',
  },
  linkButton: {
    paddingVertical: Spacing.two,
  },
  idHint: {
    textAlign: 'center',
    paddingTop: Spacing.two,
  },
});
