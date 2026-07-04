import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

import { Habit } from '@/lib/habits/types';

import { REMINDER_CHANNEL_ID } from './setup';

// Local and push notifications both carry this shape so a single tap handler can route either one.
export type NotificationRoute = {
  screen: '/habit';
  habitId: string;
};

function contentFor(habit: Habit): Notifications.NotificationContentInput {
  const route: NotificationRoute = { screen: '/habit', habitId: habit.id };
  return {
    title: `${habit.emoji} ${habit.name}`,
    body: 'Time to check in — tap to log it.',
    data: route,
  };
}

// A weekly habit needs one trigger per selected weekday (a WEEKLY trigger only fires on a single
// weekday); a daily habit is one trigger. We return every id so the exact set can be cancelled later.
export async function scheduleHabitReminders(habit: Habit): Promise<string[]> {
  const content = contentFor(habit);
  const { frequency } = habit;

  if (frequency.kind === 'daily') {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: frequency.hour,
        minute: frequency.minute,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
    return [id];
  }

  return Promise.all(
    frequency.weekdays.map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: frequency.hour,
          minute: frequency.minute,
          channelId: REMINDER_CHANNEL_ID,
        },
      })
    )
  );
}

// Only these ids — never cancelAllScheduledNotificationsAsync, which would wipe other habits too.
export async function cancelHabitReminders(notificationIds: string[]): Promise<void> {
  await Promise.all(notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function rescheduleHabitReminders(
  previousIds: string[],
  habit: Habit
): Promise<string[]> {
  await cancelHabitReminders(previousIds);
  return scheduleHabitReminders(habit);
}
