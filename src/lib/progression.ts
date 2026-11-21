import type { Exercise, UnitSystem } from '../types';
import type { LastExercisePerformance } from './workout';
import { formatWeight } from './units';

export interface ProgressionSuggestion {
  message: string;
  tone: 'progress' | 'hold';
  suggestedWeightKg?: number;
}

function roundingStep(units: UnitSystem, equipment: Exercise['equipment']): number {
  if (units === 'imperial') {
    return equipment === 'dumbbell' ? 2.5 / 2.2046226218 : 5 / 2.2046226218;
  }
  return equipment === 'dumbbell' ? 1 : 2.5;
}

function roundLoad(weightKg: number, units: UnitSystem, equipment: Exercise['equipment']): number {
  const step = roundingStep(units, equipment);
  return Math.max(step, Math.round(weightKg / step) * step);
}

/**
 * A small, explainable next-session suggestion. It never changes logged data;
 * it simply reads the last performance against the programme's rep target.
 */
export function getProgressionSuggestion(options: {
  exercise: Exercise;
  previous: LastExercisePerformance | null;
  targetRepsMin: number;
  targetRepsMax: number;
  units: UnitSystem;
}): ProgressionSuggestion | null {
  const { exercise, previous, targetRepsMax, units } = options;
  if (!previous) return null;

  const working = previous.sets.filter((set) => set.type !== 'warmup' && (set.reps ?? 0) > 0);
  if (working.length === 0) return null;

  const allAtTop = working.every((set) => (set.reps ?? 0) >= targetRepsMax);
  const bestWeight = Math.max(0, ...working.map((set) => set.weightKg ?? 0));
  const topReps = Math.max(...working.map((set) => set.reps ?? 0));

  if (exercise.equipment === 'bodyweight' || bestWeight === 0) {
    return allAtTop
      ? {
          message: `Last time every set reached ${targetRepsMax}+ reps. Progress with a pause, a slower tempo or a harder variation.`,
          tone: 'progress',
        }
      : {
          message: `Aim for ${targetRepsMax} reps on every set before making this harder — ${Math.max(0, targetRepsMax - topReps)} to go at the top.`,
          tone: 'hold',
        };
  }

  if (allAtTop) {
    const suggestedWeightKg = roundLoad(bestWeight + roundingStep(units, exercise.equipment), units, exercise.equipment);
    return {
      message: `Ready to progress — try ${formatWeight(suggestedWeightKg, units)} today. Last time you hit the top of the range on every set.`,
      tone: 'progress',
      suggestedWeightKg,
    };
  }

  const remaining = Math.max(0, targetRepsMax - topReps);
  const setsBelowTop = working.filter((set) => (set.reps ?? 0) < targetRepsMax).length;
  return {
    message:
      topReps >= targetRepsMax && setsBelowTop > 0
        ? `${setsBelowTop} set${setsBelowTop === 1 ? '' : 's'} stayed below ${targetRepsMax} reps — even those out before adding weight.`
        : remaining > 0
          ? `Stay with this load until every set reaches ${targetRepsMax} reps — ${remaining} to go at the top.`
          : 'One clean rep on every set before adding weight.',
    tone: 'hold',
  };
}
