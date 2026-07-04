import AsyncStorage from '@react-native-async-storage/async-storage';

import { Habit } from './types';

const STORAGE_KEY = 'taskker.habits.v1';

export async function getHabits(): Promise<Habit[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // don't let a bad write brick the app forever — reset and move on
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

async function save(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

export async function getHabit(id: string): Promise<Habit | undefined> {
  return (await getHabits()).find((h) => h.id === id);
}

export async function upsertHabit(habit: Habit): Promise<Habit[]> {
  const habits = await getHabits();
  const exists = habits.some((h) => h.id === habit.id);
  const next = exists ? habits.map((h) => (h.id === habit.id ? habit : h)) : [...habits, habit];
  await save(next);
  return next;
}

export async function removeHabit(id: string): Promise<Habit[]> {
  const next = (await getHabits()).filter((h) => h.id !== id);
  await save(next);
  return next;
}

export function createHabitId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
