import { describe, expect, it } from 'vitest';
import type { Exercise } from '../types';
import { getProgressionSuggestion } from './progression';
import type { LastExercisePerformance } from './workout';

const bench: Exercise = {
  id: 'bench-press',
  name: 'Barbell Bench Press',
  primary: ['chest'],
  secondary: ['triceps'],
  equipment: 'barbell',
  pattern: 'horizontal_push',
  mechanic: 'compound',
  difficulty: 2,
  description: '',
  cues: [],
  alternatives: [],
};

const bodyweight: Exercise = { ...bench, id: 'push-up', name: 'Push-Up', equipment: 'bodyweight' };

function previous(weights: number[], reps: number[]): LastExercisePerformance {
  return {
    sessionId: 's1',
    date: '2026-11-15T18:00:00.000Z',
    sessionExercise: {
      id: 'se1',
      exerciseId: 'bench-press',
      restSec: 90,
      sets: [],
    },
    sets: reps.map((value, index) => ({
      id: `set-${index}`,
      weightKg: weights[index] ?? weights[0] ?? 0,
      reps: value,
      completed: true,
      type: 'normal' as const,
    })),
  };
}

describe('progression suggestions', () => {
  it('suggests a load increase when every set hit the top of the range', () => {
    const suggestion = getProgressionSuggestion({
      exercise: bench,
      previous: previous([80, 80, 80], [10, 10, 10]),
      targetRepsMin: 8,
      targetRepsMax: 10,
      units: 'metric',
    });
    expect(suggestion?.tone).toBe('progress');
    expect(suggestion?.suggestedWeightKg).toBe(82.5);
    expect(suggestion?.message).toContain('82.5 kg');
  });

  it('holds the load when a set is below the top of the range', () => {
    const suggestion = getProgressionSuggestion({
      exercise: bench,
      previous: previous([80, 80, 80], [10, 9, 8]),
      targetRepsMin: 8,
      targetRepsMax: 10,
      units: 'metric',
    });
    expect(suggestion?.tone).toBe('hold');
    expect(suggestion?.suggestedWeightKg).toBeUndefined();
    expect(suggestion?.message).toContain('before adding weight');  });

  it('uses rep progress for bodyweight exercises', () => {
    const suggestion = getProgressionSuggestion({
      exercise: bodyweight,
      previous: previous([0, 0], [15, 15]),
      targetRepsMin: 10,
      targetRepsMax: 15,
      units: 'metric',
    });
    expect(suggestion?.tone).toBe('progress');
    expect(suggestion?.message).toContain('harder variation');
  });

  it('does not guess without a previous performance', () => {
    expect(
      getProgressionSuggestion({
        exercise: bench,
        previous: null,
        targetRepsMin: 8,
        targetRepsMax: 10,
        units: 'metric',
      }),
    ).toBeNull();
  });
});
