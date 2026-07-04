// weekdays use the expo-notifications numbering (1 = Sun ... 7 = Sat) so we can
// hand them straight to a WEEKLY trigger without converting anything.
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Frequency =
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekdays: Weekday[]; hour: number; minute: number };

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  frequency: Frequency;
  notificationIds: string[];
  streak: number;
  lastCompletedISO: string | null;
};

export type HabitDraft = {
  name: string;
  emoji: string;
  frequency: Frequency;
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: 'Sun',
  2: 'Mon',
  3: 'Tue',
  4: 'Wed',
  5: 'Thu',
  6: 'Fri',
  7: 'Sat',
};
