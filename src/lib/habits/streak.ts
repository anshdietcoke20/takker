import { Habit } from './types';

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

export function isDoneToday(habit: Habit): boolean {
  return habit.lastCompletedISO === todayKey();
}

// The stored streak is only trustworthy while the chain is unbroken. If the last
// completion is older than yesterday the run is dead, so we show 0.
export function currentStreak(habit: Habit): number {
  const last = habit.lastCompletedISO;
  if (last === todayKey() || last === yesterdayKey()) {
    return habit.streak;
  }
  return 0;
}

export function completeToday(habit: Habit): Pick<Habit, 'streak' | 'lastCompletedISO'> {
  const today = todayKey();

  if (habit.lastCompletedISO === today) {
    return { streak: habit.streak, lastCompletedISO: today };
  }

  const continuesStreak = habit.lastCompletedISO === yesterdayKey();
  return {
    streak: continuesStreak ? habit.streak + 1 : 1,
    lastCompletedISO: today,
  };
}
