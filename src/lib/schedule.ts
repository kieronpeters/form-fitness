import { differenceInCalendarDays } from 'date-fns';
import type { Program, ScheduleOccurrence, ScheduleRule, WorkoutSession } from '../types';
import { addDaysKey, fromKey, startOfWeekKey, todayKey } from './date';
import { estimateProgramDayMinutes } from './workout';

interface ExpandOptions {
  from: string;
  to: string;
  weekStartsOn?: 0 | 1;
}

export function ruleOccursOn(rule: ScheduleRule, date: string): boolean {
  if (!rule.active) return false;
  if (date < rule.startDate) return false;
  if (rule.endDate && date > rule.endDate) return false;

  if (rule.recurrence === 'once') return date === rule.startDate;

  const weekday = fromKey(date).getDay();
  if (rule.recurrence === 'daily') return true;

  const weekdays = rule.weekdays.length > 0 ? rule.weekdays : [fromKey(rule.startDate).getDay()];
  if (!weekdays.includes(weekday)) return false;

  if (rule.recurrence === 'biweekly') {
    const startWeek = fromKey(startOfWeekKey(rule.startDate));
    const currentWeek = fromKey(startOfWeekKey(date));
    const weeks = Math.round(differenceInCalendarDays(currentWeek, startWeek) / 7);
    return weeks % 2 === 0;
  }

  return rule.recurrence === 'weekly' || rule.recurrence === 'custom';
}

export function expandSchedule(
  rules: ScheduleRule[],
  programs: Program[],
  sessions: WorkoutSession[],
  { from, to }: ExpandOptions,
): ScheduleOccurrence[] {
  const programMap = new Map(programs.map((program) => [program.id, program]));
  const completed = sessions.filter((session) => session.status === 'completed');
  const occurrences: ScheduleOccurrence[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;
    const program = programMap.get(rule.programId);
    if (!program) continue;
    const day = program.days.find((item) => item.id === rule.programDayId);
    if (!day) continue;

    const start = rule.startDate > from ? rule.startDate : from;
    const end = rule.endDate && rule.endDate < to ? rule.endDate : to;
    if (start > end) continue;

    const estimatedMinutes = estimateProgramDayMinutes(day);
    let cursor = start;
    let guard = 0;
    while (cursor <= end && guard < 800) {
      if (ruleOccursOn(rule, cursor)) {
        const match = completed.find(
          (session) =>
            session.scheduledDate === cursor &&
            session.programDayId === rule.programDayId &&
            session.programId === rule.programId,
        );
        occurrences.push({
          key: `${rule.id}:${cursor}`,
          date: cursor,
          ruleId: rule.id,
          programId: rule.programId,
          programDayId: rule.programDayId,
          programName: program.name,
          dayName: day.name,
          focus: day.focus,
          exerciseCount: day.exercises.length,
          estimatedMinutes,
          completedSessionId: match?.id,
        });
      }
      cursor = addDaysKey(cursor, 1);
      guard += 1;
    }
  }

  return occurrences.sort((a, b) => a.date.localeCompare(b.date) || a.dayName.localeCompare(b.dayName));
}

export function occurrencesOnDate(occurrences: ScheduleOccurrence[], date: string): ScheduleOccurrence[] {
  return occurrences.filter((occurrence) => occurrence.date === date);
}

export function nextOccurrence(
  rules: ScheduleRule[],
  programs: Program[],
  sessions: WorkoutSession[],
  from: string = todayKey(),
  days = 21,
): ScheduleOccurrence | null {
  const occurrences = expandSchedule(rules, programs, sessions, { from, to: addDaysKey(from, days) });
  return occurrences.find((occurrence) => !occurrence.completedSessionId) ?? occurrences[0] ?? null;
}

export function recurrenceLabel(rule: ScheduleRule): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = rule.weekdays.length > 0 ? rule.weekdays.map((day) => dayNames[day]).join(', ') : dayNames[fromKey(rule.startDate).getDay()];
  switch (rule.recurrence) {
    case 'once':
      return 'Once';
    case 'daily':
      return 'Every day';
    case 'weekly':
      return `Weekly · ${days}`;
    case 'biweekly':
      return `Every 2 weeks · ${days}`;
    case 'custom':
      return days;
  }
}

export function rulesByProgram(rules: ScheduleRule[], programId: string): ScheduleRule[] {
  return rules.filter((rule) => rule.programId === programId);
}

export function scheduleRulesForDay(rules: ScheduleRule[], programDayId: string): ScheduleRule[] {
  return rules.filter((rule) => rule.programDayId === programDayId && rule.active);
}
