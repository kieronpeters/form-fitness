import { describe, expect, it } from 'vitest';
import type { Program, ScheduleRule, WorkoutSession } from '../types';
import { expandSchedule, recurrenceLabel, ruleOccursOn } from './schedule';

const program: Program = {
  id: 'p1',
  name: 'Test plan',
  description: '',
  level: 'returning',
  goal: 'build',
  daysPerWeek: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  days: [
    {
      id: 'd1',
      name: 'Day 1',
      focus: 'Push',
      exercises: [
        { id: 'pe1', exerciseId: 'bench-press', sets: 3, repsMin: 8, repsMax: 10, restSec: 90 },
      ],
    },
  ],
};

function rule(overrides: Partial<ScheduleRule> = {}): ScheduleRule {
  return {
    id: 'r1',
    programId: 'p1',
    programDayId: 'd1',
    startDate: '2026-11-02',
    recurrence: 'weekly',
    weekdays: [1],
    active: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('schedule recurrence', () => {
  it('matches weekly weekdays', () => {
    expect(ruleOccursOn(rule(), '2026-11-02')).toBe(true);
    expect(ruleOccursOn(rule(), '2026-11-03')).toBe(false);
    expect(ruleOccursOn(rule({ active: false }), '2026-11-02')).toBe(false);
  });

  it('matches every other week for biweekly rules', () => {
    expect(ruleOccursOn(rule({ recurrence: 'biweekly' }), '2026-11-02')).toBe(true);
    expect(ruleOccursOn(rule({ recurrence: 'biweekly' }), '2026-11-09')).toBe(false);
    expect(ruleOccursOn(rule({ recurrence: 'biweekly' }), '2026-11-16')).toBe(true);
  });

  it('supports daily rules with an end date', () => {
    const daily = rule({ recurrence: 'daily', endDate: '2026-11-04' });
    expect(ruleOccursOn(daily, '2026-11-03')).toBe(true);
    expect(ruleOccursOn(daily, '2026-11-04')).toBe(true);
    expect(ruleOccursOn(daily, '2026-11-05')).toBe(false);
  });

  it('expands the range and marks matching completed sessions', () => {
    const completed: WorkoutSession = {
      id: 's1',
      name: 'Day 1',
      programId: 'p1',
      programDayId: 'd1',
      scheduledDate: '2026-11-02',
      scheduledRuleId: 'r1',
      startedAt: '2026-11-02T18:00:00.000Z',
      completedAt: '2026-11-02T19:00:00.000Z',
      status: 'completed',
      exercises: [],
      photoIds: [],
    };
    const occurrences = expandSchedule([rule({ weekdays: [1, 3] })], [program], [completed], {
      from: '2026-11-01',
      to: '2026-11-08',
    });
    expect(occurrences.map((item) => item.date)).toEqual(['2026-11-02', '2026-11-04']);
    expect(occurrences[0].completedSessionId).toBe('s1');
    expect(occurrences[1].completedSessionId).toBeUndefined();
  });

  it('formats readable recurrence labels', () => {
    expect(recurrenceLabel(rule({ weekdays: [1, 3, 5] }))).toBe('Weekly · Mon, Wed, Fri');
    expect(recurrenceLabel(rule({ recurrence: 'daily' }))).toBe('Every day');
    expect(recurrenceLabel(rule({ recurrence: 'once' }))).toBe('Once');
  });
});
