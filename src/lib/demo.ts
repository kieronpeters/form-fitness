import type { BodyEntry, Exercise, SessionSet, WorkoutSession } from '../types';
import type { AppData } from '../store/appStore';
import { createId } from './ids';
import { addDaysKey, dateKey, fromKey, todayKey } from './date';

const BASE_WEIGHTS: Record<string, number> = {
  'bench-press': 60,
  'machine-chest-press': 50,
  'overhead-press': 35,
  'lateral-raise': 8,
  'push-up': 0,
  'pull-up': 0,
  'lat-pulldown': 52.5,
  'seated-row': 45,
  'straight-arm-pulldown': 20,
  'barbell-curl': 20,
  'ez-bar-curl': 17.5,
  'hack-squat': 80,
  'belt-squat': 60,
  'leg-extension': 40,
  'lying-leg-curl': 35,
  'seated-calf-raise': 40,
  'cable-fly': 15,
  'triceps-pushdown': 25,
  'goblet-squat': 24,
  'walking-lunge': 12,
};

function makeSet(weightKg: number | null, reps: number, completed = true, type: SessionSet['type'] = 'normal'): SessionSet {
  return { id: createId('set'), weightKg, reps, completed, type };
}

function roundWeight(value: number): number {
  return Math.round(value / 2.5) * 2.5;
}

/**
 * Adds a labelled block of sample training history so charts, reports and streaks
 * can be explored before the user has logged real sessions.
 */
export function generateDemoHistory(state: AppData): Partial<AppData> {
  const program = state.programs.find((item) => item.isExample) ?? state.programs[0];
  if (!program) return {};
  if (state.sessions.some((session) => session.status === 'completed')) return {};

  const today = todayKey();
  const earliest = addDaysKey(today, -34);
  const sessions: WorkoutSession[] = [];
  const bodyEntries: BodyEntry[] = [];
  let noise = 0;

  // A small deterministic wobble makes the sample feel human without being random per render.
  const wobble = () => {
    noise = (noise * 9301 + 49297) % 233280;
    return noise / 233280;
  };

  const dayByWeekday = new Map<number, (typeof program.days)[number]>();
  const rules = state.scheduleRules.filter((rule) => rule.programId === program.id);
  for (const rule of rules) {
    const programDay = program.days.find((day) => day.id === rule.programDayId);
    if (!programDay) continue;
    for (const weekday of rule.weekdays) dayByWeekday.set(weekday, programDay);
  }
  if (dayByWeekday.size === 0) {
    [1, 2, 4, 5, 6].forEach((weekday, index) => {
      const programDay = program.days[index];
      if (programDay) dayByWeekday.set(weekday, programDay);
    });
  }

  let cursor = earliest;
  while (cursor < today) {
    const weekday = fromKey(cursor).getDay();
    const programDay = dayByWeekday.get(weekday);
    const weekIndex = Math.max(0, Math.round((fromKey(cursor).getTime() - fromKey(earliest).getTime()) / (7 * 86_400_000)));
    if (programDay) {
      const exercisePlan = programDay.exercises.map((exercise, exerciseIndex) => {
        const base = BASE_WEIGHTS[exercise.exerciseId] ?? 20;
        const isBodyweight = base === 0;
        const progressed = isBodyweight ? 0 : roundWeight(base * (1 + weekIndex * 0.028) + (wobble() - 0.5) * 2.5);
        const sets: SessionSet[] = [];
        if (exerciseIndex === 0 && !isBodyweight) {
          sets.push(makeSet(roundWeight(progressed * 0.55), 8, true, 'warmup'));
        }
        for (let setIndex = 0; setIndex < exercise.sets; setIndex += 1) {
          const targetReps = exercise.repsMax - (setIndex === exercise.sets - 1 && wobble() > 0.55 ? 1 : 0);
          sets.push(makeSet(isBodyweight ? null : progressed, targetReps));
        }
        return {
          id: createId('se'),
          exerciseId: exercise.exerciseId,
          sets,
          restSec: exercise.restSec,
          targetSets: exercise.sets,
          targetRepsMin: exercise.repsMin,
          targetRepsMax: exercise.repsMax,
          note: exercise.note,
        };
      });

      const start = new Date(`${cursor}T18:15:00`);
      const durationMinutes = 54 + Math.round(wobble() * 24);
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      sessions.push({
        id: createId('session'),
        name: programDay.name,
        programId: program.id,
        programDayId: programDay.id,
        scheduledDate: cursor,
        startedAt: start.toISOString(),
        completedAt: end.toISOString(),
        status: 'completed',
        exercises: exercisePlan,
        notes: '',
        bodyweightKg: 80 - weekIndex * 0.3,
        photoIds: [],
        isSample: true,
      });
    }

    const dayNumber = Math.round((fromKey(cursor).getTime() - fromKey(earliest).getTime()) / 86_400_000);
    if (dayNumber % 5 === 0) {
      const weight = 80.2 - weekIndex * 0.34 + (wobble() - 0.5) * 0.25;
      bodyEntries.push({
        id: createId('body'),
        date: cursor,
        weightKg: Number(weight.toFixed(1)),
        measurements: {},
        energy: 3 + Math.round(wobble()),
        sleepHours: Number((7 + wobble() * 1.4).toFixed(1)),
        soreness: 1 + Math.round(wobble() * 2),
        mood: 3 + Math.round(wobble()),
        notes: '',
        createdAt: new Date(`${cursor}T08:00:00`).toISOString(),
        isSample: true,
      });
    }

    cursor = addDaysKey(cursor, 1);
  }

  return {
    sessions: [...sessions.reverse(), ...state.sessions],
    bodyEntries: [...bodyEntries, ...state.bodyEntries],
    dismissed: { ...state.dismissed, demoLoadedAt: true },
  };
}

export function isDemoDataPresent(sessions: WorkoutSession[]): boolean {
  return sessions.some((session) => session.status === 'completed' && session.notes === '');
}

export function demoDateRange(): { label: string; earliest: string } {
  return { label: 'Last 5 weeks', earliest: addDaysKey(todayKey(), -34) };
}

export function todayDate(): string {
  return dateKey(new Date());
}

export function customExerciseSeed(name: string, primary: Exercise['primary']): Exercise {
  return {
    id: createId('ex'),
    name,
    primary,
    secondary: [],
    equipment: 'other',
    pattern: 'isolation',
    mechanic: 'isolation',
    difficulty: 1,
    description: 'Custom exercise.',
    cues: [],
    alternatives: [],
    isCustom: true,
  };
}
