import type { BodyEntry, Exercise, Goal, Profile, SessionPhoto, WorkoutSession } from '../types';
import { startOfWeekKey } from './date';
import { goalProgress } from './goals';
import { computePRs, estimated1RM, sessionVolumeKg } from './workout';

export interface AchievementContext {
  sessions: WorkoutSession[];
  photos: SessionPhoto[];
  goals: Goal[];
  bodyEntries: BodyEntry[];
  profile: Profile;
  customExercises: Exercise[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone: 'lime' | 'blue' | 'coral' | 'violet' | 'gold';
  current: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string;
  unit: string;
}

type Def = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone: Achievement['tone'];
  target: number;
  unit: string;
  evaluate: (ctx: AchievementContext) => { current: number; unlockedAt?: string };
};

function sortedCompleted(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions
    .filter((session) => session.status === 'completed')
    .slice()
    .sort((a, b) => new Date(a.completedAt ?? a.startedAt).getTime() - new Date(b.completedAt ?? b.startedAt).getTime());
}

function nthSessionDate(sessions: WorkoutSession[], n: number): string | undefined {
  const completed = sortedCompleted(sessions);
  return completed[n - 1]?.completedAt ?? completed[n - 1]?.startedAt;
}

function cumulativeVolumeDate(sessions: WorkoutSession[], target: number): string | undefined {
  let total = 0;
  for (const session of sortedCompleted(sessions)) {
    total += sessionVolumeKg(session);
    if (total >= target) return session.completedAt ?? session.startedAt;
  }
  return undefined;
}

function longestWeekStreak(sessions: WorkoutSession[]): { weeks: number; endDate?: string } {
  const weekMap = new Map<string, WorkoutSession[]>();
  for (const session of sortedCompleted(sessions)) {
    const date = new Date(session.completedAt ?? session.startedAt);
    const key = startOfWeekKey(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    );
    const list = weekMap.get(key) ?? [];
    list.push(session);
    weekMap.set(key, list);
  }
  const weekKeys = [...weekMap.keys()].sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  let endDate: string | undefined;
  for (const key of weekKeys) {
    const date = new Date(`${key}T12:00:00`);
    if (previous && Math.round((date.getTime() - previous.getTime()) / (7 * 86_400_000)) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) {
      best = run;
      const sessionsInWeek = weekMap.get(key) ?? [];
      endDate = sessionsInWeek[sessionsInWeek.length - 1]?.completedAt;
    }
    previous = date;
  }
  return { weeks: best, endDate };
}

function bestWeekCount(sessions: WorkoutSession[]): { count: number; date?: string } {
  const counts = new Map<string, WorkoutSession[]>();
  for (const session of sortedCompleted(sessions)) {
    const date = new Date(session.completedAt ?? session.startedAt);
    const key = startOfWeekKey(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    );
    const list = counts.get(key) ?? [];
    list.push(session);
    counts.set(key, list);
  }
  let best: { count: number; date?: string } = { count: 0 };
  for (const list of counts.values()) {
    if (list.length > best.count) {
      const last = list[list.length - 1];
      best = { count: list.length, date: last.completedAt ?? last.startedAt };
    }
  }
  return best;
}

function firstEarlySession(sessions: WorkoutSession[], beforeHour: number): string | undefined {
  for (const session of sortedCompleted(sessions)) {
    const date = new Date(session.completedAt ?? session.startedAt);
    if (date.getHours() < beforeHour) return session.completedAt ?? session.startedAt;
  }
  return undefined;
}

function firstLateSession(sessions: WorkoutSession[], afterHour: number): string | undefined {
  for (const session of sortedCompleted(sessions)) {
    const date = new Date(session.completedAt ?? session.startedAt);
    if (date.getHours() >= afterHour) return session.completedAt ?? session.startedAt;
  }
  return undefined;
}

function uniqueExerciseCount(sessions: WorkoutSession[]): number {
  const ids = new Set<string>();
  for (const session of sortedCompleted(sessions)) {
    for (const exercise of session.exercises) {
      ids.add(exercise.exerciseId);
    }
  }
  return ids.size;
}

const DEFS: Def[] = [
  {
    id: 'first-session',
    title: 'First rep',
    description: 'Complete your first workout in Form Fitness.',
    icon: 'flag',
    tone: 'lime',
    target: 1,
    unit: 'workout',
    evaluate: (ctx) => ({ current: sortedCompleted(ctx.sessions).length, unlockedAt: nthSessionDate(ctx.sessions, 1) }),
  },
  {
    id: 'ten-sessions',
    title: 'In the rhythm',
    description: 'Complete 10 workouts.',
    icon: 'flame',
    tone: 'coral',
    target: 10,
    unit: 'workouts',
    evaluate: (ctx) => ({ current: sortedCompleted(ctx.sessions).length, unlockedAt: nthSessionDate(ctx.sessions, 10) }),
  },
  {
    id: 'fifty-sessions',
    title: 'Built different',
    description: 'Complete 50 workouts.',
    icon: 'trophy',
    tone: 'gold',
    target: 50,
    unit: 'workouts',
    evaluate: (ctx) => ({ current: sortedCompleted(ctx.sessions).length, unlockedAt: nthSessionDate(ctx.sessions, 50) }),
  },
  {
    id: 'streak-3',
    title: 'Three in a row',
    description: 'Train at least once a week for 3 weeks straight.',
    icon: 'repeat',
    tone: 'blue',
    target: 3,
    unit: 'weeks',
    evaluate: (ctx) => {
      const streak = longestWeekStreak(ctx.sessions);
      return { current: streak.weeks, unlockedAt: streak.endDate };
    },
  },
  {
    id: 'streak-8',
    title: 'Two months strong',
    description: 'Keep a weekly training streak going for 8 weeks.',
    icon: 'calendar',
    tone: 'violet',
    target: 8,
    unit: 'weeks',
    evaluate: (ctx) => {
      const streak = longestWeekStreak(ctx.sessions);
      return { current: streak.weeks, unlockedAt: streak.endDate };
    },
  },
  {
    id: 'volume-10k',
    title: 'Ten tonnes',
    description: 'Move a total of 10,000 kg in the gym.',
    icon: 'weight',
    tone: 'lime',
    target: 10_000,
    unit: 'kg',
    evaluate: (ctx) => ({
      current: Math.round(sortedCompleted(ctx.sessions).reduce((sum, session) => sum + sessionVolumeKg(session), 0)),
      unlockedAt: cumulativeVolumeDate(ctx.sessions, 10_000),
    }),
  },
  {
    id: 'volume-100k',
    title: 'Century of iron',
    description: 'Move a total of 100,000 kg.',
    icon: 'weight',
    tone: 'gold',
    target: 100_000,
    unit: 'kg',
    evaluate: (ctx) => ({
      current: Math.round(sortedCompleted(ctx.sessions).reduce((sum, session) => sum + sessionVolumeKg(session), 0)),
      unlockedAt: cumulativeVolumeDate(ctx.sessions, 100_000),
    }),
  },
  {
    id: 'pr-collector',
    title: 'PR collector',
    description: 'Hold a personal best on 5 different exercises.',
    icon: 'trending',
    tone: 'coral',
    target: 5,
    unit: 'exercises',
    evaluate: (ctx) => {
      const records = computePRs(ctx.sessions);
      const values = Object.values(records);
      const latest = values.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return { current: values.length, unlockedAt: latest?.date };
    },
  },
  {
    id: 'photo-journal',
    title: 'Progress, documented',
    description: 'Add 3 session check-in photos.',
    icon: 'camera',
    tone: 'violet',
    target: 3,
    unit: 'photos',
    evaluate: (ctx) => {
      const photos = ctx.photos.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { current: photos.length, unlockedAt: photos[2]?.createdAt };
    },
  },
  {
    id: 'goal-getter',
    title: 'Goal getter',
    description: 'Complete a personal goal.',
    icon: 'target',
    tone: 'lime',
    target: 1,
    unit: 'goal',
    evaluate: (ctx) => {
      const completed = ctx.goals.filter(
        (goal) => goal.completedAt || goalProgress(goal, { sessions: ctx.sessions, bodyEntries: ctx.bodyEntries, profile: ctx.profile }).done,
      );
      return { current: completed.length, unlockedAt: completed[0]?.completedAt };
    },
  },
  {
    id: 'early-bird',
    title: 'Early bird',
    description: 'Finish a workout before 7am.',
    icon: 'sunrise',
    tone: 'gold',
    target: 1,
    unit: 'workout',
    evaluate: (ctx) => ({ current: firstEarlySession(ctx.sessions, 7) ? 1 : 0, unlockedAt: firstEarlySession(ctx.sessions, 7) }),
  },
  {
    id: 'night-owl',
    title: 'Night owl',
    description: 'Finish a workout after 9pm.',
    icon: 'moon',
    tone: 'blue',
    target: 1,
    unit: 'workout',
    evaluate: (ctx) => ({ current: firstLateSession(ctx.sessions, 21) ? 1 : 0, unlockedAt: firstLateSession(ctx.sessions, 21) }),
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Log 10 different exercises.',
    icon: 'compass',
    tone: 'blue',
    target: 10,
    unit: 'exercises',
    evaluate: (ctx) => {
      const unique = uniqueExerciseCount(ctx.sessions);
      return { current: unique, unlockedAt: unique >= 10 ? sortedCompleted(ctx.sessions).slice(-1)[0]?.completedAt : undefined };
    },
  },
  {
    id: 'big-week',
    title: 'Big week',
    description: 'Complete 4 workouts in a single week.',
    icon: 'bolt',
    tone: 'coral',
    target: 4,
    unit: 'workouts',
    evaluate: (ctx) => {
      const best = bestWeekCount(ctx.sessions);
      return { current: best.count, unlockedAt: best.date };
    },
  },
];

export function evaluateAchievements(ctx: AchievementContext): Achievement[] {
  return DEFS.map((def) => {
    const { current, unlockedAt } = def.evaluate(ctx);
    const unlocked = current >= def.target;
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      tone: def.tone,
      current: Math.min(current, def.target),
      target: def.target,
      unlocked,
      unlockedAt: unlocked ? unlockedAt : undefined,
      unit: def.unit,
    };
  });
}

export function countPRSets(sessions: WorkoutSession[]): number {
  return Object.keys(computePRs(sessions)).length;
}

export function bestSetLabel(weightKg: number, reps: number): string {
  return `${weightKg} kg × ${reps} (${Math.round(estimated1RM(weightKg, reps))} kg e1RM)`;
}
