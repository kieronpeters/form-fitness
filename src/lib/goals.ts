import type { BodyEntry, Goal, Profile, UnitSystem, WorkoutSession } from '../types';
import { getExercise } from '../data/exercises';
import { dateKey } from './date';
import { latestWeight } from './body';
import { sessionsInRange, weekStreak } from './stats';
import { sessionVolumeKg } from './workout';
import { formatVolume, formatWeight } from './units';

export interface GoalContext {
  sessions: WorkoutSession[];
  bodyEntries: BodyEntry[];
  profile: Profile;
}

export interface GoalProgress {
  current: number;
  target: number;
  percent: number;
  done: boolean;
  headline: string;
  detail: string;
}

function createdDate(goal: Goal): string {
  return dateKey(new Date(goal.createdAt));
}

export function goalProgress(goal: Goal, context: GoalContext): GoalProgress {
  const created = createdDate(goal);
  const today = dateKey(new Date());
  const inScope = sessionsInRange(context.sessions, created, today);
  const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

  if (goal.kind === 'workouts') {
    const current = inScope.length;
    return {
      current,
      target: goal.target,
      percent: clamp((current / goal.target) * 100),
      done: current >= goal.target,
      headline: `${current} / ${goal.target} workouts`,
      detail: `Since ${new Date(goal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    };
  }

  if (goal.kind === 'volume') {
    const current = Math.round(inScope.reduce((sum, session) => sum + sessionVolumeKg(session), 0));
    return {
      current,
      target: goal.target,
      percent: clamp((current / goal.target) * 100),
      done: current >= goal.target,
      headline: `${current.toLocaleString('en-US')} / ${goal.target.toLocaleString('en-US')} kg`,
      detail: 'Total training volume',
    };
  }

  if (goal.kind === 'streak') {
    const { weeks } = weekStreak(context.sessions);
    return {
      current: weeks,
      target: goal.target,
      percent: clamp((weeks / goal.target) * 100),
      done: weeks >= goal.target,
      headline: `${weeks} / ${goal.target} weeks`,
      detail: weeks > 0 ? 'Current weekly streak' : 'Log a workout to start a streak',
    };
  }

  if (goal.kind === 'bodyweight') {
    const latest = latestWeight(context.bodyEntries, context.profile);
    const current = latest?.kg ?? context.profile.weightKg ?? 0;
    const start = goal.startingValue ?? current;
    const span = Math.abs(start - goal.target);
    const moved = Math.abs(current - start);
    const done = goal.target < start ? current <= goal.target : current >= goal.target;
    return {
      current,
      target: goal.target,
      percent: done ? 100 : span === 0 ? 0 : clamp((moved / span) * 100),
      done,
      headline: `${current.toFixed(1)} kg`,
      detail: `Target ${goal.target.toFixed(1)} kg · from ${start.toFixed(1)} kg`,
    };
  }

  if (goal.kind === 'exercise') {
    const exercise = goal.exerciseId ? getExercise(goal.exerciseId) : undefined;
    let current = 0;
    for (const session of context.sessions) {
      if (session.status !== 'completed') continue;
      for (const sessionExercise of session.exercises) {
        if (sessionExercise.exerciseId !== goal.exerciseId) continue;
        for (const set of sessionExercise.sets) {
          if (!set.completed || set.type === 'warmup' || !set.weightKg) continue;
          current = Math.max(current, set.weightKg);
        }
      }
    }
    return {
      current,
      target: goal.target,
      percent: clamp((current / goal.target) * 100),
      done: current >= goal.target,
      headline: `${current.toFixed(1)} / ${goal.target.toFixed(1)} kg`,
      detail: exercise ? `Best ${exercise.name} set` : 'Best lift',
    };
  }

  const done = Boolean(goal.completedAt);
  return {
    current: done ? goal.target : 0,
    target: goal.target,
    percent: done ? 100 : 0,
    done,
    headline: done ? 'Completed' : 'In progress',
    detail: goal.note ?? 'Personal goal',
  };
}

export function goalKindLabel(kind: Goal['kind']): string {
  switch (kind) {
    case 'workouts':
      return 'Workout count';
    case 'volume':
      return 'Training volume';
    case 'streak':
      return 'Weekly streak';
    case 'bodyweight':
      return 'Body weight';
    case 'exercise':
      return 'Lift target';
    case 'custom':
      return 'Personal';
  }
}

export function goalDefaultTitle(
  goal: Pick<Goal, 'kind' | 'target' | 'exerciseId'>,
  unitSystem: UnitSystem = 'metric',
): string {
  if (goal.kind === 'bodyweight') return `Reach ${formatWeight(goal.target, unitSystem)}`;
  if (goal.kind === 'workouts') return `Complete ${goal.target} workouts`;
  if (goal.kind === 'streak') return `Train ${goal.target} weeks in a row`;
  if (goal.kind === 'volume') return `Move ${formatVolume(goal.target, unitSystem)}`;
  if (goal.kind === 'exercise') {
    const exercise = goal.exerciseId ? getExercise(goal.exerciseId) : undefined;
    return `${exercise?.name ?? 'Lift'} ${formatWeight(goal.target, unitSystem)}`;
  }
  return 'New goal';
}
