import { describe, expect, it } from 'vitest';
import type { BodyEntry, Goal, Profile, Settings, WorkoutSession } from '../types';
import { nutritionTargets, macroTotals, scaleFood } from './nutrition';
import { goalProgress } from './goals';
import { formatDuration, formatTimer, formatWeight, kgToDisplay, displayToKg } from './units';
import { evaluateAchievements } from './achievements';

const settings: Settings = {
  theme: 'dark',
  defaultRestSec: 90,
  autoRest: true,
  firstDayOfWeek: 1,
  showRPE: false,
  hapticFeedback: true,
  nutrition: {},
};

const profile: Profile = {
  id: 'u1',
  name: 'Alex',
  goal: 'build',
  experience: 'returning',
  sex: 'male',
  birthYear: 1996,
  heightCm: 180,
  weightKg: 80,
  weeklyTarget: 4,
  unitSystem: 'metric',
  createdAt: '2026-11-01T09:00:00.000Z',
};

function session(id: string, date: string, volumeSets = 1): WorkoutSession {
  const local = new Date(`${date}T18:00:00`);
  return {
    id,
    name: 'Push',
    startedAt: local.toISOString(),
    completedAt: new Date(local.getTime() + 60 * 60_000).toISOString(),
    status: 'completed',
    exercises: [
      {
        id: `se-${id}`,
        exerciseId: 'bench-press',
        restSec: 90,
        sets: Array.from({ length: volumeSets }, (_, index) => ({
          id: `set-${id}-${index}`,
          weightKg: 60,
          reps: 10,
          completed: true,
          type: 'normal' as const,
        })),
      },
    ],
    photoIds: [],
  };
}

describe('units', () => {
  it('converts kg and pounds', () => {
    expect(kgToDisplay(100, 'imperial')).toBeCloseTo(220.46, 1);
    expect(displayToKg(220.46, 'imperial')).toBeCloseTo(100, 1);
    expect(formatWeight(80, 'metric')).toBe('80 kg');
    expect(formatWeight(80, 'imperial')).toBe('176.4 lb');
  });

  it('formats durations and timers', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(65 * 60)).toBe('1h 5m');
    expect(formatTimer(125)).toBe('2:05');
  });
});

describe('nutrition estimates', () => {
  it('estimates targets from profile and goal', () => {
    const targets = nutritionTargets(profile, settings);
    expect(targets.bmr).toBeGreaterThan(1700);
    expect(targets.tdee).toBeGreaterThan(targets.bmr);
    expect(targets.calories).toBeGreaterThan(targets.tdee);
    expect(targets.protein).toBeGreaterThanOrEqual(150);
    expect(targets.carbs).toBeGreaterThan(0);
    expect(targets.fat).toBeGreaterThan(0);
    expect(targets.source).toBe('estimated');
  });

  it('lets explicit overrides take priority', () => {
    const targets = nutritionTargets(profile, {
      ...settings,
      nutrition: { calories: 2400, protein: 180, carbs: 250, fat: 70 },
    });
    expect(targets.calories).toBe(2400);
    expect(targets.protein).toBe(180);
    expect(targets.source).toBe('custom');
  });

  it('totals and scales food entries', () => {
    expect(scaleFood({ calories: 100, protein: 10, carbs: 5, fat: 2 }, 1.5)).toEqual({
      calories: 150,
      protein: 15,
      carbs: 7.5,
      fat: 3,
    });
    expect(
      macroTotals([
        {
          id: 'f1',
          date: '2026-11-21',
          meal: 'lunch',
          name: 'Chicken',
          servingLabel: '100 g',
          quantity: 1,
          calories: 200,
          protein: 30,
          carbs: 0,
          fat: 5,
        },
      ]),
    ).toEqual({ calories: 200, protein: 30, carbs: 0, fat: 5 });
  });
});

describe('goal progress', () => {
  const bodyEntries: BodyEntry[] = [
    { id: 'b1', date: '2026-11-01', weightKg: 80, measurements: {}, createdAt: '2026-11-01T08:00:00.000Z' },
    { id: 'b2', date: '2026-11-20', weightKg: 77, measurements: {}, createdAt: '2026-11-20T08:00:00.000Z' },
  ];
  const sessions = [session('s1', '2026-11-02'), session('s2', '2026-11-05'), session('s3', '2026-11-09')];

  it('counts workouts since the goal was created', () => {
    const goal: Goal = {
      id: 'g1',
      title: 'Ten workouts',
      kind: 'workouts',
      target: 10,
      unit: 'workouts',
      createdAt: '2026-11-01T00:00:00.000Z',
    };
    const progress = goalProgress(goal, { sessions, bodyEntries, profile });
    expect(progress.current).toBe(3);
    expect(progress.percent).toBe(30);
    expect(progress.done).toBe(false);
  });

  it('handles a bodyweight target in the right direction', () => {
    const goal: Goal = {
      id: 'g2',
      title: 'Cut to 75',
      kind: 'bodyweight',
      target: 75,
      startingValue: 80,
      unit: 'kg',
      createdAt: '2026-11-01T00:00:00.000Z',
    };
    const progress = goalProgress(goal, { sessions, bodyEntries, profile });
    expect(progress.current).toBe(77);
    expect(progress.percent).toBe(60);
    expect(progress.done).toBe(false);
  });

  it('lets custom goals be marked complete', () => {
    const goal: Goal = {
      id: 'g3',
      title: 'Custom',
      kind: 'custom',
      target: 1,
      unit: '',
      createdAt: '2026-11-01T00:00:00.000Z',
      completedAt: '2026-11-10T00:00:00.000Z',
    };
    expect(goalProgress(goal, { sessions, bodyEntries, profile }).done).toBe(true);
  });
});

describe('achievements', () => {
  it('unlocks first workout and photo badges from real data', () => {
    const achievements = evaluateAchievements({
      sessions: [session('s1', '2026-11-02')],
      photos: [
        { id: 'p1', pose: 'front', date: '2026-11-02', createdAt: '2026-11-02T18:00:00.000Z' },
        { id: 'p2', pose: 'side', date: '2026-11-03', createdAt: '2026-11-03T18:00:00.000Z' },
      ],
      goals: [],
      bodyEntries: [],
      profile,
      customExercises: [],
    });
    expect(achievements.find((item) => item.id === 'first-session')?.unlocked).toBe(true);
    expect(achievements.find((item) => item.id === 'photo-journal')?.unlocked).toBe(false);
    expect(achievements.find((item) => item.id === 'photo-journal')?.current).toBe(2);
  });
});
