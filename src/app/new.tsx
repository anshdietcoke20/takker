import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useHabit, useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { formatTime } from '@/lib/habits/format';
import { Frequency, HabitDraft, Weekday, WEEKDAY_LABELS } from '@/lib/habits/types';

const EMOJI_CHOICES = ['💧', '💪', '📚', '🧑‍💻', '🏃', '🧘', '🥗', '😴'];
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

function timeToDate(hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

export default function HabitFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useHabit(id);
  const { createHabit, editHabit } = useHabits();
  const router = useRouter();
  const theme = useTheme();

  const [name, setName] = useState(editing?.name ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? EMOJI_CHOICES[0]);
  const [kind, setKind] = useState<Frequency['kind']>(editing?.frequency.kind ?? 'daily');
  const [weekdays, setWeekdays] = useState<Weekday[]>(
    editing?.frequency.kind === 'weekly' ? editing.frequency.weekdays : [2, 4, 6]
  );
  const [time, setTime] = useState<Date>(
    timeToDate(editing?.frequency.hour ?? 9, editing?.frequency.minute ?? 0)
  );
  const [showPicker, setShowPicker] = useState(false);

  function toggleWeekday(weekday: Weekday) {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((day) => day !== weekday)
        : [...current, weekday]
    );
  }

  function onChangeTime(_event: DateTimePickerEvent, selected?: Date) {
    // Android fires once and dismisses the dialog itself; iOS keeps the inline spinner open.
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selected) {
      setTime(selected);
    }
  }

  const nameValid = name.trim().length > 0;
  const weekdaysValid = kind === 'daily' || weekdays.length > 0;
  const canSave = nameValid && weekdaysValid;

  async function onSave() {
    const hour = time.getHours();
    const minute = time.getMinutes();
    const frequency: Frequency =
      kind === 'daily'
        ? { kind: 'daily', hour, minute }
        : { kind: 'weekly', weekdays, hour, minute };
    const draft: HabitDraft = { name: name.trim(), emoji, frequency };

    if (editing) {
      await editHabit(editing.id, draft);
    } else {
      await createHabit(draft);
    }
    router.back();
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <ThemedText type="small" themeColor="textSecondary">
        NAME
      </ThemedText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Drink water"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />

      <ThemedText type="small" themeColor="textSecondary">
        ICON
      </ThemedText>
      <ThemedView style={styles.chipRow}>
        {EMOJI_CHOICES.map((choice) => (
          <Pressable
            key={choice}
            onPress={() => setEmoji(choice)}
            style={[
              styles.emojiChip,
              {
                backgroundColor:
                  emoji === choice ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}>
            <ThemedText style={styles.emojiChipText}>{choice}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>

      <ThemedText type="small" themeColor="textSecondary">
        FREQUENCY
      </ThemedText>
      <ThemedView style={styles.chipRow}>
        {(['daily', 'weekly'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setKind(option)}
            style={[
              styles.segment,
              {
                backgroundColor:
                  kind === option ? theme.text : theme.backgroundElement,
              },
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: kind === option ? theme.background : theme.text }}>
              {option === 'daily' ? 'Daily' : 'Weekly'}
            </ThemedText>
          </Pressable>
        ))}
      </ThemedView>

      {kind === 'weekly' && (
        <ThemedView style={styles.chipRow}>
          {WEEKDAYS.map((weekday) => {
            const selected = weekdays.includes(weekday);
            return (
              <Pressable
                key={weekday}
                onPress={() => toggleWeekday(weekday)}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: selected ? theme.text : theme.backgroundElement,
                  },
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: selected ? theme.background : theme.text }}>
                  {WEEKDAY_LABELS[weekday]}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      )}
      {!weekdaysValid && (
        <ThemedText type="small" style={{ color: '#e5484d' }}>
          Pick at least one weekday.
        </ThemedText>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        REMINDER TIME
      </ThemedText>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.input, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="default">{formatTime(time.getHours(), time.getMinutes())}</ThemedText>
      </Pressable>
      {(showPicker || Platform.OS === 'ios') && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeTime}
        />
      )}

      <Pressable
        onPress={onSave}
        disabled={!canSave}
        style={[
          styles.saveButton,
          { backgroundColor: theme.text, opacity: canSave ? 1 : 0.4 },
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.background }}>
          {editing ? 'Save changes' : 'Create habit'}
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChipText: {
    fontSize: 24,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
