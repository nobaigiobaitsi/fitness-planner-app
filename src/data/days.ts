import { DayKey } from '@/types/domain';

export const days: { key: DayKey; label: string; shortLabel: string; jsDay: number }[] = [
  { key: 'monday', label: 'Monday', shortLabel: 'Mon', jsDay: 1 },
  { key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue', jsDay: 2 },
  { key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed', jsDay: 3 },
  { key: 'thursday', label: 'Thursday', shortLabel: 'Thu', jsDay: 4 },
  { key: 'friday', label: 'Friday', shortLabel: 'Fri', jsDay: 5 },
  { key: 'saturday', label: 'Saturday', shortLabel: 'Sat', jsDay: 6 },
  { key: 'sunday', label: 'Sunday', shortLabel: 'Sun', jsDay: 0 },
];

export function getDayKey(date = new Date()): DayKey {
  return days.find((day) => day.jsDay === date.getDay())?.key ?? 'monday';
}

export function getDayLabel(dayKey: DayKey) {
  return days.find((day) => day.key === dayKey)?.label ?? dayKey;
}
