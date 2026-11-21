import { describe, expect, it } from 'vitest';
import type { WorkoutSession } from '../types';
import { addDaysKey, dateKey, todayKey } from './date';
import { buildReport, rangeStats, weekStreak, weeklySeries } from './stats';

function makeSession(id: string, date: string, sets = 2, durationMinutes = 60, status: WorkoutSession['status'] = 'completed'): WorkoutSession {
  const local = new Date(`${date}T18:00:00`);
  return {
    id,
    name: 'Push',
    startedAt: local.toISOString(),
    completedAt: status === 'completed' ? new Date(local.getTime() + durationMinutes * 60_000).toISOString() : undefined,
    status,
    exercises: [
      {
        id: `se-${id}`,
        exerciseId: 'bench-press',
        restSec: 90,
        sets: Array.from({ length: sets }, (_, index) => ({
          id: `set-${id}-${index}`,
          weightKg: 80,
          reps: 10,
          completed: true,
          type: index === 0 ? ('warmup' as const) : ('normal' as const),
        })),
      },
    ],
    photoIds: [],
  };
}

describe('stats', () => {
  it('calculates range stats without warm-ups or active sessions', () => {
    const sessions = [
      makeSession('a', '2026-11-02', 3),
      makeSession('b', '2026-11-09', 2),
      makeSession('c', '2026-11-10', 2, 60, 'active'),
    ];
    const stats = rangeStats(sessions, '2026-11-01', '2026-11-30');
    expect(stats.workouts).toBe(2);
    expect(stats.sets).toBe(3);
    expect(stats.volumeKg).toBe(80 * 10 * 3);
    expect(stats.durationMin).toBe(120);
  });

  it('counts consecutive training weeks including the current one', () => {
    const today = todayKey();
    const sessions = [
      makeSession('a', addDaysKey(today, -14)),
      makeSession('b', addDaysKey(today, -7)),
      makeSession('c', today),
    ];
    const streak = weekStreak(sessions, 1);
    expect(streak.weeks).toBe(3);
    expect(streak.thisWeekDone).toBe(true);
  });

  it('generates a full weekly series ending this week', () => {
    const series = weeklySeries([makeSession('a', todayKey(), 3)], 4, 1);
    expect(series).toHaveLength(4);
    expect(series[3].workouts).toBe(1);
    expect(series[3].sets).toBe(2);
  });

  it('builds a monthly report with sorted weeks and correct session durations', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = dateKey(new Date(year, month, 5));
    const second = dateKey(new Date(year, month, 12));
    const third = dateKey(new Date(year, month, 19));
    const sessions = [
      makeSession('a', first, 2, 60),
      makeSession('b', second, 3, 90),
      makeSession('c', third, 2, 45),
    ];
    const report = buildReport(sessions, year, month, 'metric');
    expect(report.workouts).toBe(3);
    expect(report.trainingDays).toBe(3);
    expect(report.longestSession).toBe(90);
    expect(report.weeks.map((week) => week.weekStart)).toEqual([...report.weeks.map((week) => week.weekStart)].sort());
    expect(report.summaryText).toContain('training report');
    expect(report.volumeKg).toBe(80 * 10 * 4);
    expect(report.insights.length).toBeGreaterThan(0);
    expect(report.insights.join(' ')).toContain('moved');
  });
});
