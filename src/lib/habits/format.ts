import { Frequency, Weekday, WEEKDAY_LABELS } from './types';

export function formatTime(hour: number, minute: number): string {
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${twelveHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function describeFrequency(frequency: Frequency): string {
  const time = formatTime(frequency.hour, frequency.minute);
  if (frequency.kind === 'daily') {
    return `Every day · ${time}`;
  }
  const days = frequency.weekdays
    .slice()
    .sort((a, b) => a - b)
    .map((weekday) => WEEKDAY_LABELS[weekday as Weekday])
    .join(', ');
  return `${days || 'No days selected'} · ${time}`;
}
