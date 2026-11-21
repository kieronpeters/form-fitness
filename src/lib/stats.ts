import { addDays } from 'date-fns';
import type { Exercise, MuscleGroup, PersonalRecord, SessionPhoto, WorkoutSession } from '../types';
import { getExercise, MUSCLE_LABELS } from '../data/exercises';
import { addDaysKey, dateKey, fromKey, startOfWeekKey, todayKey, weekDays } from './date';
import { computePRs, estimated1RM, sessionDurationMinutes, sessionVolumeKg } from './workout';
import { formatVolume } from './units';

export interface RangeStats {
  workouts: number;
  volumeKg: number;
  sets: number;
  reps: number;
  durationMin: number;
  avgDurationMin: number;
  exercises: number;
  prCount: number;
  photos: number;
}

export function sessionLocalDate(session: WorkoutSession): string {
  return dateKey(new Date(session.completedAt ?? session.startedAt));
}

export function sessionsInRange(sessions: WorkoutSession[], from: string, to: string): WorkoutSession[] {
  return sessions
    .filter((session) => session.status === 'completed')
    .filter((session) => {
      const key = sessionLocalDate(session);
      return key >= from && key <= to;
    })
    .sort((a, b) => new Date(b.completedAt ?? b.startedAt).getTime() - new Date(a.completedAt ?? a.startedAt).getTime());
}

export function rangeStats(
  sessions: WorkoutSession[],
  from: string,
  to: string,
  photos: SessionPhoto[] = [],
): RangeStats {
  const ranged = sessionsInRange(sessions, from, to);
  const volumeKg = ranged.reduce((sum, session) => sum + sessionVolumeKg(session), 0);
  const sets = ranged.reduce(
    (sum, session) =>
      sum + session.exercises.reduce((inner, exercise) => inner + exercise.sets.filter((set) => set.completed && set.type !== 'warmup').length, 0),
    0,
  );
  const reps = ranged.reduce(
    (sum, session) =>
      sum + session.exercises.reduce((inner, exercise) => inner + exercise.sets.filter((set) => set.completed).reduce((s, set) => s + (set.reps ?? 0), 0), 0),
    0,
  );
  const durationMin = ranged.reduce((sum, session) => sum + sessionDurationMinutes(session), 0);
  const exerciseIds = new Set(ranged.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId)));
  const prs = computePRs(ranged);
  const photoCount = photos.filter((photo) => photo.date >= from && photo.date <= to).length;

  return {
    workouts: ranged.length,
    volumeKg,
    sets,
    reps,
    durationMin,
    avgDurationMin: ranged.length ? Math.round(durationMin / ranged.length) : 0,
    exercises: exerciseIds.size,
    prCount: Object.keys(prs).length,
    photos: photoCount,
  };
}

export interface WeekPoint {
  weekStart: string;
  workouts: number;
  volumeKg: number;
  durationMin: number;
  sets: number;
}

export function weeklySeries(sessions: WorkoutSession[], weeks: number, weekStartsOn: 0 | 1 = 1): WeekPoint[] {
  const today = todayKey();
  const currentWeekStart = startOfWeekKey(today, weekStartsOn);
  const points: WeekPoint[] = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekStart = addDaysKey(currentWeekStart, -7 * i);
    const weekEnd = addDaysKey(weekStart, 6);
    const stats = rangeStats(sessions, weekStart, weekEnd);
    points.push({
      weekStart,
      workouts: stats.workouts,
      volumeKg: stats.volumeKg,
      durationMin: stats.durationMin,
      sets: stats.sets,
    });
  }
  return points;
}

export function workoutsThisWeek(sessions: WorkoutSession[], weekStartsOn: 0 | 1 = 1): number {
  const today = todayKey();
  const start = startOfWeekKey(today, weekStartsOn);
  return sessionsInRange(sessions, start, addDaysKey(start, 6)).length;
}

export function volumeThisWeek(sessions: WorkoutSession[], weekStartsOn: 0 | 1 = 1): number {
  const today = todayKey();
  const start = startOfWeekKey(today, weekStartsOn);
  return sessionsInRange(sessions, start, addDaysKey(start, 6)).reduce((sum, session) => sum + sessionVolumeKg(session), 0);
}

export function weekStreak(sessions: WorkoutSession[], weekStartsOn: 0 | 1 = 1): { weeks: number; thisWeekDone: boolean } {
  const weeksWithWorkouts = new Set(
    sessions.filter((session) => session.status === 'completed').map((session) => startOfWeekKey(sessionLocalDate(session), weekStartsOn)),
  );
  const thisWeek = startOfWeekKey(todayKey(), weekStartsOn);
  const thisWeekDone = weeksWithWorkouts.has(thisWeek);
  let cursor = thisWeekDone ? thisWeek : addDaysKey(thisWeek, -7);
  let count = 0;
  while (weeksWithWorkouts.has(cursor) && count < 520) {
    count += 1;
    cursor = addDaysKey(cursor, -7);
  }
  return { weeks: count, thisWeekDone };
}

export function muscleDistribution(
  sessions: WorkoutSession[],
  custom: Parameters<typeof getExercise>[1] = [],
): Array<{ muscle: MuscleGroup; sets: number }> {
  const counts = new Map<MuscleGroup, number>();
  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    for (const sessionExercise of session.exercises) {
      const exercise = getExercise(sessionExercise.exerciseId, custom);
      if (!exercise) continue;
      const completedSets = sessionExercise.sets.filter((set) => set.completed && set.type !== 'warmup').length;
      if (completedSets === 0) continue;
      for (const muscle of exercise.primary) {
        counts.set(muscle, (counts.get(muscle) ?? 0) + completedSets);
      }
      for (const muscle of exercise.secondary) {
        counts.set(muscle, (counts.get(muscle) ?? 0) + completedSets * 0.5);
      }
    }
  }
  return [...counts.entries()]
    .map(([muscle, sets]) => ({ muscle, sets: Math.round(sets) }))
    .sort((a, b) => b.sets - a.sets);
}

export function weekdayFrequency(sessions: WorkoutSession[]): number[] {
  const counts = Array.from({ length: 7 }, () => 0);
  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    counts[fromKey(sessionLocalDate(session)).getDay()] += 1;
  }
  return counts;
}

export function totalStats(sessions: WorkoutSession[]): {
  workouts: number;
  volumeKg: number;
  sets: number;
  minutes: number;
  prs: PersonalRecord[];
} {
  const completed = sessions.filter((session) => session.status === 'completed');
  return {
    workouts: completed.length,
    volumeKg: completed.reduce((sum, session) => sum + sessionVolumeKg(session), 0),
    sets: completed.reduce(
      (sum, session) =>
        sum + session.exercises.reduce((inner, exercise) => inner + exercise.sets.filter((set) => set.completed && set.type !== 'warmup').length, 0),
      0,
    ),
    minutes: completed.reduce((sum, session) => sum + sessionDurationMinutes(session), 0),
    prs: Object.values(computePRs(completed)),
  };
}

export function bestExerciseSetForWeight(sessions: WorkoutSession[], exerciseId: string): number {
  let best = 0;
  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    for (const exercise of session.exercises) {
      if (exercise.exerciseId !== exerciseId) continue;
      for (const set of exercise.sets) {
        if (!set.completed || set.type === 'warmup') continue;
        const oneRm = estimated1RM(set.weightKg, set.reps);
        if (oneRm > best) best = oneRm;
      }
    }
  }
  return best;
}

export function lastNDays(n: number): string[] {
  const today = todayKey();
  return Array.from({ length: n }, (_, index) => addDaysKey(today, -(n - 1 - index)));
}

export function weekRange(weekStartsOn: 0 | 1 = 1): { start: string; end: string; days: string[] } {
  const start = startOfWeekKey(todayKey(), weekStartsOn);
  return { start, end: addDaysKey(start, 6), days: weekDays(todayKey(), weekStartsOn) };
}

export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

export interface ExerciseSummary {
  exerciseId: string;
  sets: number;
  volumeKg: number;
  sessions: number;
  best1RM: number;
  trend: number[];
}

export function exerciseSummaryStats(sessions: WorkoutSession[], _custom: Exercise[] = []): ExerciseSummary[] {
  const map = new Map<string, ExerciseSummary>();
  const ordered = sessions
    .filter((session) => session.status === 'completed')
    .slice()
    .sort((a, b) => new Date(a.completedAt ?? a.startedAt).getTime() - new Date(b.completedAt ?? b.startedAt).getTime());

  for (const session of ordered) {
    for (const sessionExercise of session.exercises) {
      const working = sessionExercise.sets.filter((set) => set.type !== 'warmup');
      if (working.length === 0) continue;
      const current = map.get(sessionExercise.exerciseId) ?? {
        exerciseId: sessionExercise.exerciseId,
        sets: 0,
        volumeKg: 0,
        sessions: 0,
        best1RM: 0,
        trend: [],
      };
      let best = 0;
      for (const set of working) {
        current.sets += 1;
        current.volumeKg += (set.weightKg ?? 0) * (set.reps ?? 0);
        best = Math.max(best, estimated1RM(set.weightKg, set.reps));
      }
      current.sessions += 1;
      current.best1RM = Math.max(current.best1RM, best);
      current.trend.push(Math.round(best));
      map.set(sessionExercise.exerciseId, current);
    }
  }

  return [...map.values()].sort((a, b) => b.sets - a.sets);
}

export interface ReportWeek {
  weekStart: string;
  label: string;
  volumeKg: number;
  workouts: number;
}

export interface MonthlyReport {
  label: string;
  start: string;
  end: string;
  workouts: number;
  volumeKg: number;
  durationMin: number;
  sets: number;
  trainingDays: number;
  prs: PersonalRecord[];
  muscles: Array<{ muscle: MuscleGroup; sets: number }>;
  weeks: ReportWeek[];
  topExercises: ExerciseSummary[];
  previousWorkouts: number;
  previousVolumeKg: number;
  previousDurationMin: number;
  bestWeek: ReportWeek | null;
  longestSession: number;
  photoCount: number;
  insights: string[];
  summaryText: string;
}

export function buildReport(
  sessions: WorkoutSession[],
  year: number,
  month: number,
  units: 'metric' | 'imperial',
  photos: SessionPhoto[] = [],
  custom: Exercise[] = [],
): MonthlyReport {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end = dateKey(new Date(year, month + 1, 0));
  const ranged = sessionsInRange(sessions, start, end);
  const stats = rangeStats(sessions, start, end, photos);
  const previousStart = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-01`;
  const previousEnd = dateKey(new Date(year, month, 0));
  const previous = rangeStats(sessions, previousStart, previousEnd);
  const prs = Object.values(computePRs(ranged)).sort((a, b) => b.estimated1RM - a.estimated1RM);
  const muscles = muscleDistribution(ranged, custom);
  const topExercises = exerciseSummaryStats(ranged, custom)
    .slice()
    .sort((a, b) => b.volumeKg - a.volumeKg)
    .slice(0, 5);
  const trainingDays = new Set(ranged.map((session) => sessionLocalDate(session))).size;
  const photoCount = photos.filter((photo) => photo.date >= start && photo.date <= end).length;

  const weekMap = new Map<string, ReportWeek>();
  for (const session of ranged) {
    const weekStart = startOfWeekKey(sessionLocalDate(session), 1);
    const current = weekMap.get(weekStart) ?? {
      weekStart,
      label: new Date(`${weekStart}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volumeKg: 0,
      workouts: 0,
    };
    current.volumeKg += sessionVolumeKg(session);
    current.workouts += 1;
    weekMap.set(weekStart, current);
  }
  const weeks = [...weekMap.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const bestWeek = [...weeks].sort((a, b) => b.volumeKg - a.volumeKg)[0] ?? null;
  const longestSession = ranged.reduce((longest, session) => Math.max(longest, sessionDurationMinutes(session)), 0);

  const label = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const insights: string[] = [];
  if (stats.workouts === 0) {
    insights.push('No sessions were recorded this month. One logged workout is enough to start a trend.');
  } else {
    const workoutDiff = stats.workouts - previous.workouts;
    if (previous.workouts > 0) {
      insights.push(
        workoutDiff === 0
          ? `You matched last month with ${stats.workouts} workouts.`
          : workoutDiff > 0
            ? `${workoutDiff} more workout${workoutDiff === 1 ? '' : 's'} than last month — ${stats.workouts} in total.`
            : `${Math.abs(workoutDiff)} fewer workout${Math.abs(workoutDiff) === 1 ? '' : 's'} than last month, across ${trainingDays} training days.`,
      );
    } else {
      insights.push(`A new baseline: ${stats.workouts} workouts across ${trainingDays} training days.`);
    }

    if (previous.volumeKg > 0) {
      const volumeChange = Math.round(((stats.volumeKg - previous.volumeKg) / previous.volumeKg) * 100);
      insights.push(
        `Volume ${volumeChange >= 0 ? 'up' : 'down'} ${Math.abs(volumeChange)}% versus last month — ${formatVolume(stats.volumeKg, units)} moved.`,
      );
    } else {
      insights.push(`${formatVolume(stats.volumeKg, units)} moved in ${Math.round(stats.durationMin / 60)} training hours.`);
    }

    if (muscles.length > 0) {
      const topMuscle = muscles[0];
      const leastMuscle = muscles[muscles.length - 1];
      insights.push(
        `${MUSCLE_LABELS[topMuscle.muscle]} led the month with ${topMuscle.sets} weighted sets; ${MUSCLE_LABELS[leastMuscle.muscle]} received ${leastMuscle.sets}.`,
      );
    }

    if (prs.length > 0) {
      const topLift = getExercise(prs[0].exerciseId, custom)?.name ?? 'a main lift';
      insights.push(`Top estimated 1RM: ${topLift} at ${Math.round(prs[0].estimated1RM)} kg e1RM.`);
    }

    if (photoCount > 0) {
      insights.push(`${photoCount} progress photo${photoCount === 1 ? '' : 's'} documented the month.`);
    }
  }

  const summaryText = [
    `FORM — ${label} training report`,
    `${stats.workouts} workouts across ${trainingDays} training days.`,
    `${formatVolume(stats.volumeKg, units)} moved in ${Math.round(stats.durationMin / 60)} hours.`,
    `${stats.sets} working sets. Best lifts: ${prs
      .slice(0, 3)
      .map((record) => `${getExercise(record.exerciseId, custom)?.name ?? 'Lift'} ${Math.round(record.estimated1RM)} kg e1RM`)
      .join(', ') || 'none recorded'}.`,
    `Top focus: ${muscles
      .slice(0, 3)
      .map((item) => `${item.muscle.replaceAll('_', ' ')} (${item.sets} sets)`)
      .join(', ') || 'no sets'}.`,
    `Compared with ${new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })}: ${stats.workouts - previous.workouts >= 0 ? '+' : ''}${stats.workouts - previous.workouts} workouts, ${formatVolume(stats.volumeKg, units)} vs ${formatVolume(previous.volumeKg, units)}.`,
  ].join('\n');

  return {
    label,
    start,
    end,
    workouts: stats.workouts,
    volumeKg: stats.volumeKg,
    durationMin: stats.durationMin,
    sets: stats.sets,
    trainingDays,
    prs,
    muscles,
    weeks,
    topExercises,
    previousWorkouts: previous.workouts,
    previousVolumeKg: previous.volumeKg,
    previousDurationMin: previous.durationMin,
    bestWeek,
    longestSession,
    photoCount,
    insights,
    summaryText,
  };
}
