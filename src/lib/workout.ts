import type { PersonalRecord, ProgramDay, SessionExercise, SessionSet, WorkoutSession } from '../types';

export function setVolumeKg(set: SessionSet): number {
  if (!set.completed || set.type === 'warmup') return 0;
  return Math.max(0, set.weightKg ?? 0) * Math.max(0, set.reps ?? 0);
}

export function sessionVolumeKg(session: WorkoutSession, includeWarmup = false): number {
  return session.exercises.reduce((sum, exercise) => {
    return (
      sum +
      exercise.sets.reduce((setSum, set) => {
        if (!set.completed) return setSum;
        if (!includeWarmup && set.type === 'warmup') return setSum;
        return setSum + Math.max(0, set.weightKg ?? 0) * Math.max(0, set.reps ?? 0);
      }, 0)
    );
  }, 0);
}

export function sessionWorkingSets(session: WorkoutSession): number {
  return session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.completed && set.type !== 'warmup').length,
    0,
  );
}

export function sessionReps(session: WorkoutSession): number {
  return session.exercises.reduce(
    (sum, exercise) =>
      sum + exercise.sets.filter((set) => set.completed).reduce((setSum, set) => setSum + (set.reps ?? 0), 0),
    0,
  );
}

export function sessionDurationSeconds(session: WorkoutSession): number {
  const end = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
  const start = new Date(session.startedAt).getTime();
  return Math.max(0, Math.round((end - start) / 1000));
}

export function sessionDurationMinutes(session: WorkoutSession): number {
  return Math.round(sessionDurationSeconds(session) / 60);
}

export function estimated1RM(weightKg: number | null, reps: number | null): number {
  if (!weightKg || !reps || reps < 1) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function bestWorkingSet(sets: SessionSet[]): SessionSet | null {
  const completed = sets.filter((set) => set.completed && set.type !== 'warmup' && (set.reps ?? 0) > 0);
  if (completed.length === 0) return null;
  return completed.reduce((best, set) =>
    estimated1RM(set.weightKg, set.reps) > estimated1RM(best.weightKg, best.reps) ? set : best,
  );
}

export interface LastExercisePerformance {
  sessionId: string;
  date: string;
  sets: SessionSet[];
  sessionExercise: SessionExercise;
}

export function lastExercisePerformance(
  sessions: WorkoutSession[],
  exerciseId: string,
  excludeSessionId?: string,
): LastExercisePerformance | null {
  const completed = sessions
    .filter((session) => session.status === 'completed' && session.id !== excludeSessionId)
    .slice()
    .sort((a, b) => new Date(b.completedAt ?? b.startedAt).getTime() - new Date(a.completedAt ?? a.startedAt).getTime());

  for (const session of completed) {
    const sessionExercise = session.exercises.find((exercise) => exercise.exerciseId === exerciseId);
    if (!sessionExercise) continue;
    const sets = sessionExercise.sets.filter((set) => set.completed && set.type !== 'warmup');
    if (sets.length === 0) continue;
    return {
      sessionId: session.id,
      date: session.completedAt ?? session.startedAt,
      sets,
      sessionExercise,
    };
  }
  return null;
}

export function previousSetValue(
  previous: LastExercisePerformance | null,
  setIndex: number,
): SessionSet | null {
  if (!previous) return null;
  return previous.sets[setIndex] ?? previous.sets[previous.sets.length - 1] ?? null;
}

export function computePRs(sessions: WorkoutSession[]): Record<string, PersonalRecord> {
  const records: Record<string, PersonalRecord> = {};
  const completed = sessions
    .filter((session) => session.status === 'completed')
    .slice()
    .sort((a, b) => new Date(a.completedAt ?? a.startedAt).getTime() - new Date(b.completedAt ?? b.startedAt).getTime());

  for (const session of completed) {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        if (!set.completed || set.type === 'warmup' || !set.reps || !set.weightKg) continue;
        const oneRm = estimated1RM(set.weightKg, set.reps);
        const current = records[exercise.exerciseId];
        if (!current || oneRm > current.estimated1RM) {
          records[exercise.exerciseId] = {
            exerciseId: exercise.exerciseId,
            weightKg: set.weightKg,
            reps: set.reps,
            estimated1RM: oneRm,
            date: session.completedAt ?? session.startedAt,
            sessionId: session.id,
          };
        }
      }
    }
  }
  return records;
}

export interface PRMoment {
  exerciseId: string;
  weightKg: number;
  reps: number;
  estimated1RM: number;
  previous1RM: number | null;
}

export function newPRsInSession(session: WorkoutSession, allSessions: WorkoutSession[]): PRMoment[] {
  if (session.status !== 'completed') return [];
  const prior = allSessions.filter((item) => item.id !== session.id && item.status === 'completed');
  const priorRecords = computePRs(prior);
  const moments: PRMoment[] = [];

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      if (!set.completed || set.type === 'warmup' || !set.reps || !set.weightKg) continue;
      const oneRm = estimated1RM(set.weightKg, set.reps);
      const previous = priorRecords[exercise.exerciseId];
      if (oneRm > (previous?.estimated1RM ?? 0) + 0.01) {
        moments.push({
          exerciseId: exercise.exerciseId,
          weightKg: set.weightKg,
          reps: set.reps,
          estimated1RM: oneRm,
          previous1RM: previous?.estimated1RM ?? null,
        });
        break;
      }
    }
  }
  return moments;
}

export interface ExercisePoint {
  date: string;
  bestWeightKg: number;
  bestReps: number;
  estimated1RM: number;
  volumeKg: number;
  sessionId: string;
}

export function exerciseHistory(sessions: WorkoutSession[], exerciseId: string): ExercisePoint[] {
  return sessions
    .filter((session) => session.status === 'completed')
    .slice()
    .sort((a, b) => new Date(a.completedAt ?? a.startedAt).getTime() - new Date(b.completedAt ?? b.startedAt).getTime())
    .flatMap((session) => {
      const exercise = session.exercises.find((item) => item.exerciseId === exerciseId);
      if (!exercise) return [];
      const sets = exercise.sets.filter((set) => set.completed && set.type !== 'warmup');
      if (sets.length === 0) return [];
      let best = sets[0];
      for (const set of sets) {
        if (estimated1RM(set.weightKg, set.reps) > estimated1RM(best.weightKg, best.reps)) best = set;
      }
      return [
        {
          date: session.completedAt ?? session.startedAt,
          bestWeightKg: best.weightKg ?? 0,
          bestReps: best.reps ?? 0,
          estimated1RM: estimated1RM(best.weightKg, best.reps),
          volumeKg: sets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0),
          sessionId: session.id,
        },
      ];
    });
}

export function estimateProgramDayMinutes(day: ProgramDay): number {
  const workingSeconds = day.exercises.reduce((sum, exercise) => sum + exercise.sets * (35 + exercise.restSec), 0);
  return Math.max(10, Math.round(workingSeconds / 60 + 8));
}

export function formatSetList(sets: SessionSet[]): string {
  if (sets.length === 0) return 'No sets';
  return sets
    .filter((set) => set.type !== 'warmup')
    .map((set) => `${set.weightKg ?? 0}×${set.reps ?? 0}`)
    .join(', ');
}

export function formatTargetReps(min: number, max: number): string {
  return min === max ? `${min}` : `${min}–${max}`;
}

export function uniqueExercisesInRange(sessions: WorkoutSession[], fromKey?: string, toKey?: string): string[] {
  const ids = new Set<string>();
  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    const date = (session.completedAt ?? session.startedAt).slice(0, 10);
    if (fromKey && date < fromKey) continue;
    if (toKey && date > toKey) continue;
    for (const exercise of session.exercises) ids.add(exercise.exerciseId);
  }
  return [...ids];
}
