import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';

export const DATE_KEY = 'yyyy-MM-dd';

export function dateKey(date: Date = new Date()): string {
  return format(date, DATE_KEY);
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function fromKey(key: string): Date {
  return parseISO(key);
}

export function toDisplayDate(key: string | Date): string {
  const date = typeof key === 'string' ? fromKey(key) : key;
  return format(date, 'EEE, MMM d');
}

export function toLongDate(key: string | Date): string {
  const date = typeof key === 'string' ? fromKey(key) : key;
  return format(date, 'EEEE, MMMM d');
}

export function toMonthDay(key: string | Date): string {
  const date = typeof key === 'string' ? fromKey(key) : key;
  return format(date, 'MMM d');
}

export function toMonthLabel(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function addDaysKey(key: string, amount: number): string {
  return dateKey(addDays(fromKey(key), amount));
}

export function startOfWeekKey(key: string, weekStartsOn: 0 | 1 = 1): string {
  return dateKey(startOfWeek(fromKey(key), { weekStartsOn }));
}

export function endOfWeekKey(key: string, weekStartsOn: 0 | 1 = 1): string {
  return dateKey(endOfWeek(fromKey(key), { weekStartsOn }));
}

export function weekDays(key: string, weekStartsOn: 0 | 1 = 1): string[] {
  const start = startOfWeek(fromKey(key), { weekStartsOn });
  return Array.from({ length: 7 }, (_, index) => dateKey(addDays(start, index)));
}

export function monthGrid(month: Date, weekStartsOn: 0 | 1 = 1): string[] {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn });
  return eachDayOfInterval({ start: first, end: last }).map(dateKey);
}

export function daysAgoKey(days: number): string {
  return dateKey(subDays(new Date(), days));
}

export function relativeDayLabel(key: string): string {
  const date = fromKey(key);
  const diff = differenceInCalendarDays(date, new Date());
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  if (diff < -1 && diff > -7) return format(date, 'EEEE');
  return format(date, 'MMM d');
}

export function shortWeekday(date: Date | string): string {
  return format(typeof date === 'string' ? fromKey(date) : date, 'EEE');
}

export function weekdayName(index: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index] ?? '';
}

export function weekdayShort(index: number): string {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index] ?? '';
}

export function relTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return format(date, 'MMM d');
}

export function isSameDateKey(a: string, b: string): boolean {
  return a === b;
}

export { isSameDay, isToday, diffDays };

function diffDays(a: Date | string, b: Date | string): number {
  return differenceInCalendarDays(typeof a === 'string' ? fromKey(a) : a, typeof b === 'string' ? fromKey(b) : b);
}
