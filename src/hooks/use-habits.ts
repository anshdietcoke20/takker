import { useSyncExternalStore } from 'react';

import { createHabitId, getHabits, removeHabit, upsertHabit } from '@/lib/habits/storage';
import { completeToday } from '@/lib/habits/streak';
import { Habit, HabitDraft } from '@/lib/habits/types';
import {
  cancelHabitReminders,
  rescheduleHabitReminders,
  scheduleHabitReminders,
} from '@/lib/notifications/schedule';

// A small shared store so Today, the detail screen and the form all see the same list and stay in
// sync. It also keeps the storage + scheduling dance in one place, out of the screens.

type State = {
  habits: Habit[];
  loaded: boolean;
};

let state: State = { habits: [], loaded: false };
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((fn) => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let loading = false;
function loadOnce() {
  if (loading) return;
  loading = true;
  getHabits().then((habits) => setState({ habits, loaded: true }));
}

// Scheduling depends on permission, and a denial shouldn't lose the habit — it just won't remind.
async function scheduleOrSkip(habit: Habit): Promise<string[]> {
  try {
    return await scheduleHabitReminders(habit);
  } catch {
    return [];
  }
}

async function createHabit(draft: HabitDraft): Promise<Habit> {
  const habit: Habit = {
    id: createHabitId(),
    ...draft,
    notificationIds: [],
    streak: 0,
    lastCompletedISO: null,
  };
  habit.notificationIds = await scheduleOrSkip(habit);
  setState({ habits: await upsertHabit(habit), loaded: true });
  return habit;
}

async function editHabit(id: string, draft: HabitDraft) {
  const existing = state.habits.find((h) => h.id === id);
  if (!existing) return;

  const updated: Habit = { ...existing, ...draft };
  let notificationIds: string[] = [];
  try {
    notificationIds = await rescheduleHabitReminders(existing.notificationIds, updated);
  } catch {
    // permission may have been revoked since creation; keep the edit, drop the reminders
    await cancelHabitReminders(existing.notificationIds);
  }
  setState({ habits: await upsertHabit({ ...updated, notificationIds }), loaded: true });
}

async function deleteHabit(id: string) {
  const existing = state.habits.find((h) => h.id === id);
  if (existing) await cancelHabitReminders(existing.notificationIds);
  setState({ habits: await removeHabit(id), loaded: true });
}

async function markDone(id: string) {
  const existing = state.habits.find((h) => h.id === id);
  if (!existing) return;
  setState({ habits: await upsertHabit({ ...existing, ...completeToday(existing) }), loaded: true });
}

export function useHabits() {
  loadOnce();
  const snapshot = useSyncExternalStore(subscribe, () => state);
  return { ...snapshot, createHabit, editHabit, deleteHabit, markDone };
}

export function useHabit(id: string | undefined): Habit | undefined {
  const { habits } = useHabits();
  return habits.find((h) => h.id === id);
}
