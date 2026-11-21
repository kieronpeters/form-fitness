import type { ExperienceLevel, Program, ProgramDay, ProgramExercise } from '../types';
import { createId } from './ids';

export function createProgramExercise(exerciseId: string, overrides: Partial<ProgramExercise> = {}): ProgramExercise {
  return {
    id: createId('pe'),
    exerciseId,
    sets: 3,
    repsMin: 8,
    repsMax: 10,
    restSec: 90,
    ...overrides,
  };
}

export function createProgramDay(name = 'New day', focus = 'Full body'): ProgramDay {
  return { id: createId('day'), name, focus, exercises: [] };
}

export function createProgram(name: string, level: ExperienceLevel = 'returning'): Program {
  const now = new Date().toISOString();
  return {
    id: createId('prog'),
    name,
    description: 'A custom training programme.',
    level,
    goal: 'build',
    daysPerWeek: 1,
    days: [createProgramDay('Day 1', 'Full body')],
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneProgram(program: Program): Program {
  const now = new Date().toISOString();
  return {
    ...program,
    id: createId('prog'),
    name: `${program.name} (copy)`,
    isExample: false,
    createdAt: now,
    updatedAt: now,
    days: program.days.map((day) => ({
      ...day,
      id: createId('day'),
      exercises: day.exercises.map((exercise) => ({ ...exercise, id: createId('pe') })),
    })),
  };
}

export function programExerciseSummary(exercise: ProgramExercise): string {
  const reps = exercise.repsMin === exercise.repsMax ? `${exercise.repsMin}` : `${exercise.repsMin}–${exercise.repsMax}`;
  return `${exercise.sets} × ${reps}`;
}

export function programSetCount(program: Program): number {
  return program.days.reduce(
    (sum, day) => sum + day.exercises.reduce((daySum, exercise) => daySum + exercise.sets, 0),
    0,
  );
}

export function programEstimatedMinutes(program: Program): number {
  return program.days.reduce((sum, day) => {
    const seconds = day.exercises.reduce((daySum, exercise) => daySum + exercise.sets * (35 + exercise.restSec), 0);
    return sum + Math.max(10, Math.round(seconds / 60 + 8));
  }, 0);
}
