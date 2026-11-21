import { describe, expect, it } from 'vitest';
import type { SessionExercise, WorkoutSession } from '../types';
import {
  computePRs,
  estimated1RM,
  lastExercisePerformance,
  newPRsInSession,
  sessionVolumeKg,
  sessionWorkingSets,
} from './workout';

function exercise(overrides: Partial<SessionExercise> = {}): SessionExercise {
  return {
    id: 'se1',
    exerciseId: 'bench-press',
    restSec: 90,
    sets: [
      { id: 's1', weightKg: 60, reps: 10, completed: true, type: 'normal' },
      { id: 's2', weightKg: 60, reps: 9, completed: true, type: 'normal' },
      { id: 's3', weightKg: 40, reps: 8, completed: true, type: 'warmup' },
      { id: 's4', weightKg: 60, reps: 8, completed: false, type: 'normal' },
    ],
    ...overrides,
  };
}

function session(id: string, date: string, overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  const local = new Date(`${date}T18:00:00`);
  return {
    id,
    name: 'Push',
    startedAt: local.toISOString(),
    completedAt: new Date(local.getTime() + 60 * 60_000).toISOString(),
    status: 'completed',
    exercises: [exercise()],
    photoIds: [],
    ...overrides,
  };
}

describe('workout maths', () => {
  it('excludes warm-up and uncompleted sets from volume', () => {
    const value = sessionVolumeKg(session('a', '2026-10-01'));
    expect(value).toBe(60 * 10 + 60 * 9);
    expect(sessionWorkingSets(session('a', '2026-10-01'))).toBe(2);
  });

  it('estimates 1RM with Epley and treats a single as the load', () => {
    expect(Math.round(estimated1RM(100, 5) * 100) / 100).toBeCloseTo(116.67, 1);
    expect(estimated1RM(100, 1)).toBe(100);
    expect(estimated1RM(null, 5)).toBe(0);
  });

  it('finds the best estimated 1RM across sessions', () => {
    const records = computePRs([
      session('a', '2026-10-01'),
      session('b', '2026-10-08', {
        exercises: [exercise({ sets: [{ id: 'x', weightKg: 70, reps: 8, completed: true, type: 'normal' }] })],
      }),
    ]);
    expect(records['bench-press'].weightKg).toBe(70);
    expect(Math.round(records['bench-press'].estimated1RM)).toBe(89);
  });

  it('reports new PRs relative to prior sessions', () => {
    const previous = session('a', '2026-10-01');
    const current = session('b', '2026-10-08', {
      exercises: [exercise({ sets: [{ id: 'x', weightKg: 65, reps: 10, completed: true, type: 'normal' }] })],
    });
    const moments = newPRsInSession(current, [previous, current]);
    expect(moments).toHaveLength(1);
    expect(Math.round(moments[0].previous1RM ?? 0)).toBe(80);
    expect(Math.round(moments[0].estimated1RM)).toBe(87);
  });

  it('returns the latest completed performance and ignores the active session', () => {
    const older = session('a', '2026-10-01');
    const newer = session('b', '2026-10-08');
    const active = session('c', '2026-10-15', { status: 'active', completedAt: undefined });
    const result = lastExercisePerformance([older, newer, active], 'bench-press');
    expect(result?.sessionId).toBe('b');
    expect(result?.sets).toHaveLength(2);
  });
});
