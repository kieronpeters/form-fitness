import type { Profile, Program, ScheduleRule, Settings } from '../types';
import { createId } from '../lib/ids';
import { startOfWeekKey, todayKey } from '../lib/date';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  defaultRestSec: 90,
  autoRest: true,
  firstDayOfWeek: 1,
  showRPE: false,
  hapticFeedback: true,
  nutrition: {},
};

export function seedProfile(): Profile {
  return {
    id: createId('user'),
    name: 'Alex Rivera',
    goal: 'build',
    experience: 'returning',
    sex: 'male',
    birthYear: 1994,
    heightCm: 178,
    weightKg: 78,
    weeklyTarget: 5,
    unitSystem: 'metric',
    bio: 'Chasing a stronger, more consistent version of myself. Five days a week, one rep at a time.',
    createdAt: new Date().toISOString(),
  };
}

interface SeedExercise {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec?: number;
  note?: string;
}

function day(name: string, focus: string, exercises: SeedExercise[]): Program['days'][number] {
  return {
    id: createId('day'),
    name,
    focus,
    exercises: exercises.map((exercise) => ({
      id: createId('pe'),
      exerciseId: exercise.exerciseId,
      sets: exercise.sets,
      repsMin: exercise.repsMin,
      repsMax: exercise.repsMax,
      restSec: exercise.restSec ?? 90,
      note: exercise.note,
    })),
  };
}

/**
 * The five-day Push / Pull / Legs / Upper Accessory / Lower Volume plan provided
 * with the reference pack, imported as ordinary editable programme data.
 */
export function seedExampleProgram(): Program {
  const now = new Date().toISOString();
  const days = [
    day('Day 1 — Push', 'Chest · shoulders · triceps', [
      { exerciseId: 'bench-press', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'machine-chest-press', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'overhead-press', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'lateral-raise', sets: 3, repsMin: 12, repsMax: 15, restSec: 60 },
      { exerciseId: 'push-up', sets: 3, repsMin: 10, repsMax: 15, restSec: 60, note: 'Take each set near failure with good form.' },
    ]),
    day('Day 2 — Pull', 'Back · biceps', [
      { exerciseId: 'pull-up', sets: 3, repsMin: 6, repsMax: 10 },
      { exerciseId: 'lat-pulldown', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'seated-row', sets: 3, repsMin: 8, repsMax: 10 },
      { exerciseId: 'straight-arm-pulldown', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'barbell-curl', sets: 3, repsMin: 8, repsMax: 10, restSec: 60 },
    ]),
    day('Day 3 — Legs', 'Quads · hamstrings · calves', [
      { exerciseId: 'hack-squat', sets: 3, repsMin: 6, repsMax: 8, restSec: 120 },
      { exerciseId: 'belt-squat', sets: 3, repsMin: 8, repsMax: 10, restSec: 120 },
      { exerciseId: 'leg-extension', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'lying-leg-curl', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'seated-calf-raise', sets: 4, repsMin: 12, repsMax: 15, restSec: 60 },
    ]),
    day('Day 4 — Upper Accessory', 'Upper body · moderate loads', [
      { exerciseId: 'machine-chest-press', sets: 3, repsMin: 10, repsMax: 12, note: 'Light — leave 2–3 reps in reserve.' },
      { exerciseId: 'cable-fly', sets: 3, repsMin: 12, repsMax: 15, restSec: 60 },
      { exerciseId: 'straight-arm-pulldown', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'ez-bar-curl', sets: 3, repsMin: 10, repsMax: 12, restSec: 60 },
      { exerciseId: 'triceps-pushdown', sets: 3, repsMin: 10, repsMax: 12, restSec: 60 },
    ]),
    day('Day 5 — Lower Volume', 'Quads · glutes · hamstrings', [
      { exerciseId: 'goblet-squat', sets: 4, repsMin: 10, repsMax: 12 },
      { exerciseId: 'walking-lunge', sets: 4, repsMin: 10, repsMax: 12, note: 'Reps per leg.' },
      { exerciseId: 'lying-leg-curl', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'leg-extension', sets: 3, repsMin: 10, repsMax: 12 },
      { exerciseId: 'seated-calf-raise', sets: 4, repsMin: 12, repsMax: 15, restSec: 60 },
    ]),
  ];

  return {
    id: createId('prog'),
    name: '5-Day Strength & Maintenance',
    description:
      'A balanced five-day push / pull / legs split for building and maintaining strength. Warm up with 5 minutes of easy cardio before every session and rest 60–90 seconds between sets. When you hit the top of a rep range with good form, add a small amount of weight next time.',
    level: 'returning',
    goal: 'build',
    daysPerWeek: 5,
    days,
    isExample: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function seedSchedule(program: Program): ScheduleRule[] {
  const weekStart = startOfWeekKey(todayKey(), 1);
  const weekdays = [1, 2, 4, 5, 6];
  const now = new Date().toISOString();
  return program.days.map((programDay, index) => ({
    id: createId('rule'),
    programId: program.id,
    programDayId: programDay.id,
    startDate: weekStart,
    recurrence: 'weekly',
    weekdays: [weekdays[index] ?? ((index + 1) % 7)],
    active: true,
    createdAt: now,
  }));
}
