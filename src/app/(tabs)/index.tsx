import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { describeFrequency } from '@/lib/habits/format';
import { currentStreak, isDoneToday } from '@/lib/habits/streak';
import { Habit } from '@/lib/habits/types';

function HabitRow({ habit, onDone }: { habit: Habit; onDone: (id: string) => void }) {
  const router = useRouter();
  const done = isDoneToday(habit);
  const streak = currentStreak(habit);
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedText style={styles.rowEmoji}>{habit.emoji}</ThemedText>
        <ThemedView type="backgroundElement" style={styles.rowBody}>
          <ThemedText type="default">{habit.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {describeFrequency(habit.frequency)}
          </ThemedText>
          <ThemedText type="small">{streak > 0 ? `🔥 ${streak} day streak` : 'No streak yet'}</ThemedText>
        </ThemedView>
        <Pressable
          onPress={() => onDone(habit.id)}
          disabled={done}
          hitSlop={8}
          style={[
            styles.doneButton,
            { backgroundColor: done ? theme.backgroundSelected : theme.text },
          ]}>
          <ThemedText
            type="smallBold"
            style={{ color: done ? theme.textSecondary : theme.background }}>
            {done ? 'Done ✓' : 'Mark done'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </Pressable>
  );
}

export default function TodayScreen() {
  const { habits, loaded, markDone } = useHabits();
  const router = useRouter();
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <Pressable
        onPress={() => router.push('/new')}
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: theme.text },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.background }}>
          ＋ New habit
        </ThemedText>
      </Pressable>

      {loaded && habits.length === 0 && (
        <ThemedView type="backgroundElement" style={styles.empty}>
          <ThemedText type="subtitle">No habits yet</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>
            Create your first habit and schedule a reminder to build a streak.
          </ThemedText>
        </ThemedView>
      )}

      {habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} onDone={markDone} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowEmoji: {
    fontSize: 32,
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  doneButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  empty: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  emptyText: {
    textAlign: 'left',
  },
  pressed: {
    opacity: 0.7,
  },
});
