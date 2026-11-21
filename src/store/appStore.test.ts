import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialData, useAppStore } from './appStore';
import { createId } from '../lib/ids';
import type { BodyEntry, FoodEntry } from '../types';

function resetStore() {
  try {
    window.localStorage.clear();
  } catch {
    // Storage may be unavailable under the test runner; the store still resets below.
  }
  useAppStore.setState(createInitialData());
}

const food = (overrides: Partial<FoodEntry> = {}): FoodEntry => ({
  id: createId('food'),
  date: '2026-11-21',
  meal: 'breakfast',
  name: 'Oats',
  servingLabel: '40 g',
  quantity: 1,
  calories: 150,
  protein: 5,
  carbs: 27,
  fat: 3,
  ...overrides,
});

describe('app store', () => {
  beforeEach(resetStore);

  it('starts a programmed workout, logs a set, and finishes cleanly', () => {
    const state = useAppStore.getState();
    const program = state.programs[0];
    const day = program.days[0];
    const sessionId = state.startWorkoutFromDay(program.id, day.id);
    expect(sessionId).toBeTruthy();

    let session = useAppStore.getState().sessions.find((item) => item.id === sessionId)!;
    expect(session.status).toBe('active');
    expect(session.exercises).toHaveLength(day.exercises.length);
    expect(session.exercises[0].sets.length).toBe(day.exercises[0].sets);

    const firstExercise = session.exercises[0];
    const firstSet = firstExercise.sets[0];
    state.updateSet(sessionId, firstExercise.id, firstSet.id, { weightKg: 100, reps: 10 });
    state.toggleSetComplete(sessionId, firstExercise.id, firstSet.id);

    session = useAppStore.getState().sessions.find((item) => item.id === sessionId)!;
    expect(session.exercises[0].sets[0].completed).toBe(true);
    expect(useAppStore.getState().restTimer).not.toBeNull();

    const finished = useAppStore.getState().finishWorkout(sessionId);
    expect(finished?.status).toBe('completed');
    expect(finished?.completedAt).toBeTruthy();
    expect(finished?.exercises).toHaveLength(1);
    expect(finished?.exercises[0].sets).toHaveLength(1);
    expect(useAppStore.getState().restTimer).toBeNull();
  });

  it('prevents a second active session', () => {
    const state = useAppStore.getState();
    const program = state.programs[0];
    const first = state.startWorkoutFromDay(program.id, program.days[0].id);
    const second = state.startWorkoutFromDay(program.id, program.days[1].id);
    expect(second).toBe(first);
    expect(useAppStore.getState().sessions.filter((item) => item.status === 'active')).toHaveLength(1);
  });

  it('creates, pauses and deletes a repeating schedule', () => {
    const state = useAppStore.getState();
    const program = state.programs[0];
    const ruleId = state.scheduleWorkout(program.id, program.days[0].id, '2026-12-01', 'weekly', [2, 4]);
    let rules = useAppStore.getState().scheduleRules;
    const rule = rules.find((item) => item.id === ruleId)!;
    expect(rule.weekdays).toEqual([2, 4]);
    expect(rule.recurrence).toBe('weekly');

    useAppStore.getState().toggleScheduleRule(ruleId);
    rules = useAppStore.getState().scheduleRules;
    expect(rules.find((item) => item.id === ruleId)?.active).toBe(false);

    useAppStore.getState().deleteScheduleRule(ruleId);
    expect(useAppStore.getState().scheduleRules.find((item) => item.id === ruleId)).toBeUndefined();
  });

  it('logs food, saves a meal and reuses it', () => {
    const state = useAppStore.getState();
    const entry = food();
    state.addFoodEntry(entry);
    const meal = useAppStore.getState().saveMeal('Breakfast', [entry]);
    expect(useAppStore.getState().savedMeals).toHaveLength(1);

    useAppStore.getState().logSavedMeal(meal.id, '2026-11-22', 'lunch');
    const entries = useAppStore.getState().foodEntries;
    expect(entries).toHaveLength(2);
    expect(entries[0].date).toBe('2026-11-22');
    expect(entries[0].meal).toBe('lunch');
  });

  it('merges a body check-in by date', () => {
    const state = useAppStore.getState();
    const base: BodyEntry = {
      id: createId('body'),
      date: '2026-11-21',
      weightKg: 78,
      measurements: { waist: 80 },
      energy: 3,
      createdAt: '2026-11-21T08:00:00.000Z',
    };
    state.upsertBodyEntry(base);
    useAppStore.getState().upsertBodyEntry({ ...base, id: createId('body'), weightKg: 77.8, sleepHours: 7.5 });
    const entries = useAppStore.getState().bodyEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0].weightKg).toBe(77.8);
    expect(entries[0].sleepHours).toBe(7.5);
    expect(entries[0].id).toBe(base.id);
  });

  it('adds and deletes a session photo using the local photo fallback', async () => {
    const state = useAppStore.getState();
    const program = state.programs[0];
    const sessionId = state.startWorkoutFromDay(program.id, program.days[0].id);
    const photo = await useAppStore.getState().addSessionPhoto(sessionId, 'front', 'data:image/png;base64,abc');
    expect(useAppStore.getState().sessionPhotos).toHaveLength(1);
    expect(useAppStore.getState().sessions[0].photoIds).toContain(photo.id);

    await useAppStore.getState().removeSessionPhoto(photo.id);
    expect(useAppStore.getState().sessionPhotos).toHaveLength(0);
    expect(useAppStore.getState().sessions[0].photoIds).toHaveLength(0);
  });

  it('generates warm-up sets from the first working weight', () => {
    const state = useAppStore.getState();
    const program = state.programs[0];
    const day = program.days.find((item) => item.exercises.some((exercise) => exercise.exerciseId === 'bench-press')) ?? program.days[0];
    const sessionId = state.startWorkoutFromDay(program.id, day.id);
    let session = useAppStore.getState().sessions.find((item) => item.id === sessionId)!;
    const benchExercise = session.exercises.find((exercise) => exercise.exerciseId === 'bench-press');
    if (!benchExercise) return;
    const workingSet = benchExercise.sets[0];
    useAppStore.getState().updateSet(sessionId, benchExercise.id, workingSet.id, { weightKg: 100, reps: 8 });
    const added = useAppStore.getState().addWarmupSets(sessionId, benchExercise.id);
    expect(added).toBe(3);
    session = useAppStore.getState().sessions.find((item) => item.id === sessionId)!;
    const updated = session.exercises.find((exercise) => exercise.id === benchExercise.id)!;
    expect(updated.sets.filter((set) => set.type === 'warmup')).toHaveLength(3);
    expect(updated.sets[0].type).toBe('warmup');
    expect(useAppStore.getState().addWarmupSets(sessionId, benchExercise.id)).toBe(0);
  });

  it('duplicates a programme day with fresh ids', () => {
    const state = useAppStore.getState();
    const program = state.programs[0];
    const before = program.days.length;
    const original = program.days[0];
    const newDayId = useAppStore.getState().duplicateProgramDay(program.id, original.id);
    expect(newDayId).toBeTruthy();
    const updated = useAppStore.getState().programs.find((item) => item.id === program.id)!;
    expect(updated.days).toHaveLength(before + 1);
    const copy = updated.days.find((day) => day.id === newDayId)!;
    expect(copy.name).toContain('(copy)');
    expect(copy.id).not.toBe(original.id);
    expect(copy.exercises[0].id).not.toBe(original.exercises[0].id);
  });

  it('copies every food entry from one day to another', () => {
    const state = useAppStore.getState();
    state.addFoodEntry(food({ date: '2026-11-20' }));
    useAppStore.getState().addFoodEntry(food({ id: createId('food'), date: '2026-11-20', name: 'Banana', calories: 105 }));
    expect(useAppStore.getState().copyFoodDay('2026-11-20', '2026-11-21')).toBe(2);
    const copied = useAppStore.getState().foodEntries.filter((entry) => entry.date === '2026-11-21');
    expect(copied).toHaveLength(2);
    expect(copied.map((entry) => entry.name).sort()).toEqual(['Banana', 'Oats']);
  });
});
