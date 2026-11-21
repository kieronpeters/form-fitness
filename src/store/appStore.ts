import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  BodyEntry,
  Exercise,
  ExportBundle,
  FoodEntry,
  Goal,
  Profile,
  Program,
  ProgramDay,
  ProgramExercise,
  SavedMeal,
  ScheduleRule,
  SessionPhoto,
  Settings,
  WorkoutSession,
} from '../types';
import { DEFAULT_SETTINGS, seedExampleProgram, seedProfile, seedSchedule } from '../data/seed';
import { createId } from '../lib/ids';
import { todayKey } from '../lib/date';
import {
  cloneProgram,
  createProgram,
  createProgramDay,
  createProgramExercise,
} from '../lib/program';
import { lastExercisePerformance, previousSetValue } from '../lib/workout';
import { generateDemoHistory } from '../lib/demo';
import { warmupPlan } from '../lib/plates';
import { clearPhotos, getPhoto, putPhoto, deletePhoto, cachePhotoUrl } from '../lib/photoDb';

export const STORAGE_KEY = 'form-app-v1';

const memoryStore = new Map<string, string>();
const fallbackStorage: Storage = {
  get length() {
    return memoryStore.size;
  },
  clear: () => memoryStore.clear(),
  getItem: (key) => memoryStore.get(key) ?? null,
  key: (index) => [...memoryStore.keys()][index] ?? null,
  removeItem: (key) => {
    memoryStore.delete(key);
  },
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
};

function resolveStorage(): Storage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Private-mode browsers can throw on access; use the in-memory fallback.
  }
  return fallbackStorage;
}

export interface RestTimerState {
  durationSec: number;
  endsAt: number;
  startedAt: number;
  label: string;
}

export interface AppData {
  profile: Profile;
  settings: Settings;
  programs: Program[];
  sessions: WorkoutSession[];
  scheduleRules: ScheduleRule[];
  sessionPhotos: SessionPhoto[];
  customExercises: Exercise[];
  foodEntries: FoodEntry[];
  savedMeals: SavedMeal[];
  bodyEntries: BodyEntry[];
  goals: Goal[];
  articleBookmarks: string[];
  dismissed: Record<string, boolean>;
  restTimer: RestTimerState | null;
}

export interface NewWorkoutOptions {
  scheduledDate?: string;
  scheduledRuleId?: string;
}

export interface AppActions {
  updateProfile: (patch: Partial<Profile>) => void;
  setProfilePhoto: (dataUrl: string | undefined) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateNutritionTargets: (patch: Partial<Settings['nutrition']>) => void;

  createProgram: (name: string) => string;
  saveProgram: (program: Program) => void;
  updateProgram: (programId: string, patch: Partial<Program>) => void;
  deleteProgram: (programId: string) => void;
  duplicateProgram: (programId: string) => string | null;

  addProgramDay: (programId: string, name?: string, focus?: string) => string | null;
  updateProgramDay: (programId: string, dayId: string, patch: Partial<ProgramDay>) => void;
  deleteProgramDay: (programId: string, dayId: string) => void;
  moveProgramDay: (programId: string, dayId: string, direction: -1 | 1) => void;
  duplicateProgramDay: (programId: string, dayId: string) => string | null;
  addExerciseToDay: (programId: string, dayId: string, exerciseId: string) => void;
  updateProgramExercise: (programId: string, dayId: string, exerciseId: string, patch: Partial<ProgramExercise>) => void;
  deleteProgramExercise: (programId: string, dayId: string, exerciseId: string) => void;
  moveProgramExercise: (programId: string, dayId: string, exerciseId: string, direction: -1 | 1) => void;

  startWorkoutFromDay: (programId: string, dayId: string, options?: NewWorkoutOptions) => string;
  startEmptyWorkout: (name?: string) => string;
  addExerciseToSession: (sessionId: string, exerciseId: string) => void;
  removeSessionExercise: (sessionId: string, exerciseId: string) => void;
  swapSessionExercise: (sessionId: string, exerciseId: string, newExerciseId: string) => void;
  addSet: (sessionId: string, exerciseId: string) => void;
  removeSet: (sessionId: string, exerciseId: string, setId: string) => void;
  updateSet: (
    sessionId: string,
    exerciseId: string,
    setId: string,
    patch: Partial<{ weightKg: number | null; reps: number | null; rpe: number | null; type: 'normal' | 'warmup' }>,
  ) => void;
  toggleSetComplete: (sessionId: string, exerciseId: string, setId: string) => void;
  addWarmupSets: (sessionId: string, exerciseId: string) => number;
  updateSessionExerciseNote: (sessionId: string, exerciseId: string, note: string) => void;
  renameSession: (sessionId: string, name: string) => void;
  setSessionNotes: (sessionId: string, notes: string) => void;
  setSessionBodyweight: (sessionId: string, bodyweightKg: number | undefined) => void;
  finishWorkout: (sessionId: string) => WorkoutSession | null;
  discardWorkout: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  repeatWorkout: (sessionId: string) => string | null;

  addSessionPhoto: (sessionId: string, pose: SessionPhoto['pose'], dataUrl: string) => Promise<SessionPhoto>;
  removeSessionPhoto: (photoId: string) => Promise<void>;

  addScheduleRule: (rule: ScheduleRule) => void;
  scheduleWorkout: (
    programId: string,
    programDayId: string,
    date: string,
    recurrence: ScheduleRule['recurrence'],
    weekdays?: number[],
    endDate?: string,
  ) => string;
  updateScheduleRule: (ruleId: string, patch: Partial<ScheduleRule>) => void;
  deleteScheduleRule: (ruleId: string) => void;
  toggleScheduleRule: (ruleId: string) => void;

  addFoodEntry: (entry: FoodEntry) => void;
  updateFoodEntry: (entryId: string, patch: Partial<FoodEntry>) => void;
  deleteFoodEntry: (entryId: string) => void;
  saveMeal: (name: string, entries: FoodEntry[]) => SavedMeal;
  deleteSavedMeal: (mealId: string) => void;
  logSavedMeal: (mealId: string, date: string, meal: FoodEntry['meal']) => void;
  copyFoodDay: (fromDate: string, toDate: string) => number;

  upsertBodyEntry: (entry: BodyEntry) => string;
  deleteBodyEntry: (entryId: string) => void;

  addGoal: (goal: Goal) => void;
  updateGoal: (goalId: string, patch: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  completeGoal: (goalId: string) => void;
  reopenGoal: (goalId: string) => void;

  addCustomExercise: (exercise: Exercise) => void;
  toggleBookmark: (slug: string) => void;
  dismiss: (key: string) => void;

  startRestTimer: (seconds: number, label?: string) => void;
  adjustRestTimer: (seconds: number) => void;
  clearRestTimer: () => void;

  exportBundle: () => Promise<ExportBundle>;
  importBundle: (bundle: ExportBundle) => Promise<void>;
  resetToSeed: () => Promise<void>;
  loadDemoHistory: () => void;
  removeSampleData: () => void;
  replaceData: (data: Partial<AppData>) => void;
}

export type AppStore = AppData & AppActions;

export function createInitialData(): AppData {
  const profile = seedProfile();
  const program = seedExampleProgram();
  return {
    profile,
    settings: { ...DEFAULT_SETTINGS },
    programs: [program],
    sessions: [],
    scheduleRules: seedSchedule(program),
    sessionPhotos: [],
    customExercises: [],
    foodEntries: [],
    savedMeals: [],
    bodyEntries: [],
    goals: [
      {
        id: createId('goal'),
        title: 'Train 5 days this week',
        kind: 'workouts',
        target: 5,
        unit: 'workouts',
        createdAt: new Date().toISOString(),
        note: 'Match the plan. Consistency first.',
      },
      {
        id: createId('goal'),
        title: 'Build a 4-week streak',
        kind: 'streak',
        target: 4,
        unit: 'weeks',
        createdAt: new Date().toISOString(),
      },
    ],
    articleBookmarks: [],
    dismissed: {},
    restTimer: null,
  };
}

function updateSession(
  sessions: WorkoutSession[],
  sessionId: string,
  updater: (session: WorkoutSession) => WorkoutSession,
): WorkoutSession[] {
  return sessions.map((session) => (session.id === sessionId ? updater(session) : session));
}

function updateSessionExercise(
  session: WorkoutSession,
  exerciseId: string,
  updater: (exercise: WorkoutSession['exercises'][number]) => WorkoutSession['exercises'][number],
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => (exercise.id === exerciseId ? updater(exercise) : exercise)),
  };
}

function buildSessionExercise(
  exerciseId: string,
  sessions: WorkoutSession[],
  options: { sets?: number; repsMin?: number; repsMax?: number; restSec?: number; note?: string } = {},
): WorkoutSession['exercises'][number] {
  const last = lastExercisePerformance(sessions, exerciseId);
  const setCount = options.sets ?? Math.max(3, last?.sets.length ?? 3);
  const targetReps = options.repsMax ?? 10;
  const sets = Array.from({ length: setCount }, (_, index) => {
    const previous = previousSetValue(last, index);
    return {
      id: createId('set'),
      weightKg: previous?.weightKg ?? null,
      reps: previous?.reps ?? targetReps,
      completed: false,
      type: 'normal' as const,
    };
  });
  return {
    id: createId('se'),
    exerciseId,
    sets,
    restSec: options.restSec ?? 90,
    note: options.note,
    targetSets: options.sets ?? setCount,
    targetRepsMin: options.repsMin ?? 8,
    targetRepsMax: options.repsMax ?? 10,
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createInitialData(),

      updateProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
      setProfilePhoto: (dataUrl) =>
        set((state) => ({ profile: { ...state.profile, avatarUrl: dataUrl } })),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      updateNutritionTargets: (patch) =>
        set((state) => ({
          settings: { ...state.settings, nutrition: { ...state.settings.nutrition, ...patch } },
        })),

      createProgram: (name) => {
        const program = createProgram(name);
        set((state) => ({ programs: [program, ...state.programs] }));
        return program.id;
      },
      saveProgram: (program) =>
        set((state) => {
          const exists = state.programs.some((item) => item.id === program.id);
          const normalized = { ...program, daysPerWeek: program.days.length, updatedAt: new Date().toISOString() };
          return {
            programs: exists
              ? state.programs.map((item) => (item.id === program.id ? normalized : item))
              : [normalized, ...state.programs],
          };
        }),
      updateProgram: (programId, patch) =>
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === programId ? { ...program, ...patch, updatedAt: new Date().toISOString() } : program,
          ),
        })),
      deleteProgram: (programId) =>
        set((state) => ({
          programs: state.programs.filter((program) => program.id !== programId),
          scheduleRules: state.scheduleRules.filter((rule) => rule.programId !== programId),
        })),
      duplicateProgram: (programId) => {
        const program = get().programs.find((item) => item.id === programId);
        if (!program) return null;
        const copy = cloneProgram(program);
        set((state) => ({ programs: [copy, ...state.programs] }));
        return copy.id;
      },

      addProgramDay: (programId, name, focus) => {
        const program = get().programs.find((item) => item.id === programId);
        if (!program) return null;
        const day = createProgramDay(name ?? `Day ${program.days.length + 1}`, focus ?? 'Full body');
        set((state) => ({
          programs: state.programs.map((item) =>
            item.id === programId
              ? { ...item, days: [...item.days, day], daysPerWeek: item.days.length + 1, updatedAt: new Date().toISOString() }
              : item,
          ),
        }));
        return day.id;
      },
      updateProgramDay: (programId, dayId, patch) =>
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === programId
              ? {
                  ...program,
                  days: program.days.map((day) => (day.id === dayId ? { ...day, ...patch } : day)),
                  updatedAt: new Date().toISOString(),
                }
              : program,
          ),
        })),
      deleteProgramDay: (programId, dayId) =>
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === programId
              ? {
                  ...program,
                  days: program.days.filter((day) => day.id !== dayId),
                  daysPerWeek: Math.max(0, program.days.length - 1),
                  updatedAt: new Date().toISOString(),
                }
              : program,
          ),
          scheduleRules: state.scheduleRules.filter((rule) => !(rule.programId === programId && rule.programDayId === dayId)),
        })),
      moveProgramDay: (programId, dayId, direction) =>
        set((state) => ({
          programs: state.programs.map((program) => {
            if (program.id !== programId) return program;
            const index = program.days.findIndex((day) => day.id === dayId);
            const target = index + direction;
            if (index < 0 || target < 0 || target >= program.days.length) return program;
            const days = program.days.slice();
            [days[index], days[target]] = [days[target], days[index]];
            return { ...program, days, updatedAt: new Date().toISOString() };
          }),
        })),
      duplicateProgramDay: (programId, dayId) => {
        const program = get().programs.find((item) => item.id === programId);
        const day = program?.days.find((item) => item.id === dayId);
        if (!program || !day) return null;
        const copy: ProgramDay = {
          ...day,
          id: createId('day'),
          name: `${day.name} (copy)`,
          exercises: day.exercises.map((exercise) => ({ ...exercise, id: createId('pe') })),
        };
        set((state) => ({
          programs: state.programs.map((item) => {
            if (item.id !== programId) return item;
            const index = item.days.findIndex((candidate) => candidate.id === dayId);
            const days = item.days.slice();
            days.splice(index + 1, 0, copy);
            return { ...item, days, daysPerWeek: days.length, updatedAt: new Date().toISOString() };
          }),
        }));
        return copy.id;
      },
      addExerciseToDay: (programId, dayId, exerciseId) =>
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === programId
              ? {
                  ...program,
                  days: program.days.map((day) =>
                    day.id === dayId ? { ...day, exercises: [...day.exercises, createProgramExercise(exerciseId)] } : day,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : program,
          ),
        })),
      updateProgramExercise: (programId, dayId, exerciseId, patch) =>
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === programId
              ? {
                  ...program,
                  days: program.days.map((day) =>
                    day.id === dayId
                      ? {
                          ...day,
                          exercises: day.exercises.map((exercise) =>
                            exercise.id === exerciseId ? { ...exercise, ...patch } : exercise,
                          ),
                        }
                      : day,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : program,
          ),
        })),
      deleteProgramExercise: (programId, dayId, exerciseId) =>
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === programId
              ? {
                  ...program,
                  days: program.days.map((day) =>
                    day.id === dayId
                      ? { ...day, exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId) }
                      : day,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : program,
          ),
        })),
      moveProgramExercise: (programId, dayId, exerciseId, direction) =>
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === programId
              ? {
                  ...program,
                  days: program.days.map((day) => {
                    if (day.id !== dayId) return day;
                    const index = day.exercises.findIndex((exercise) => exercise.id === exerciseId);
                    const target = index + direction;
                    if (index < 0 || target < 0 || target >= day.exercises.length) return day;
                    const exercises = day.exercises.slice();
                    [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
                    return { ...day, exercises };
                  }),
                  updatedAt: new Date().toISOString(),
                }
              : program,
          ),
        })),

      startWorkoutFromDay: (programId, dayId, options) => {
        const state = get();
        const active = state.sessions.find((session) => session.status === 'active');
        if (active) return active.id;
        const program = state.programs.find((item) => item.id === programId);
        const day = program?.days.find((item) => item.id === dayId);
        if (!program || !day) return '';
        const exercises = day.exercises.map((exercise) =>
          buildSessionExercise(exercise.exerciseId, state.sessions, {
            sets: exercise.sets,
            repsMin: exercise.repsMin,
            repsMax: exercise.repsMax,
            restSec: exercise.restSec,
            note: exercise.note,
          }),
        );
        const session: WorkoutSession = {
          id: createId('session'),
          name: day.name,
          programId,
          programDayId: dayId,
          scheduledDate: options?.scheduledDate,
          scheduledRuleId: options?.scheduledRuleId,
          startedAt: new Date().toISOString(),
          status: 'active',
          exercises,
          notes: '',
          bodyweightKg: state.profile.weightKg,
          photoIds: [],
        };
        set({ sessions: [session, ...state.sessions] });
        return session.id;
      },

      startEmptyWorkout: (name = 'Freestyle workout') => {
        const state = get();
        const active = state.sessions.find((session) => session.status === 'active');
        if (active) return active.id;
        const session: WorkoutSession = {
          id: createId('session'),
          name,
          startedAt: new Date().toISOString(),
          status: 'active',
          exercises: [],
          notes: '',
          bodyweightKg: state.profile.weightKg,
          photoIds: [],
        };
        set({ sessions: [session, ...state.sessions] });
        return session.id;
      },

      addExerciseToSession: (sessionId, exerciseId) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) => ({
            ...session,
            exercises: [...session.exercises, buildSessionExercise(exerciseId, state.sessions)],
          })),
        })),

      removeSessionExercise: (sessionId, exerciseId) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) => ({
            ...session,
            exercises: session.exercises.filter((exercise) => exercise.id !== exerciseId),
          })),
        })),

      swapSessionExercise: (sessionId, exerciseId, newExerciseId) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) =>
            updateSessionExercise(session, exerciseId, (exercise) => {
              const rebuilt = buildSessionExercise(newExerciseId, state.sessions, {
                sets: exercise.sets.length,
                repsMin: exercise.targetRepsMin,
                repsMax: exercise.targetRepsMax,
                restSec: exercise.restSec,
                note: exercise.note,
              });
              return {
                ...rebuilt,
                id: exercise.id,
                replacedFromId: exercise.replacedFromId ?? exercise.exerciseId,
                note: exercise.note,
              };
            }),
          ),
        })),

      addSet: (sessionId, exerciseId) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) =>
            updateSessionExercise(session, exerciseId, (exercise) => {
              const last = exercise.sets[exercise.sets.length - 1];
              return {
                ...exercise,
                sets: [
                  ...exercise.sets,
                  {
                    id: createId('set'),
                    weightKg: last?.weightKg ?? null,
                    reps: last?.reps ?? exercise.targetRepsMax ?? 10,
                    completed: false,
                    type: 'normal',
                  },
                ],
              };
            }),
          ),
        })),

      removeSet: (sessionId, exerciseId, setId) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) =>
            updateSessionExercise(session, exerciseId, (exercise) => ({
              ...exercise,
              sets: exercise.sets.filter((setItem) => setItem.id !== setId),
            })),
          ),
        })),

      updateSet: (sessionId, exerciseId, setId, patch) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) =>
            updateSessionExercise(session, exerciseId, (exercise) => ({
              ...exercise,
              sets: exercise.sets.map((setItem) => (setItem.id === setId ? { ...setItem, ...patch } : setItem)),
            })),
          ),
        })),

      toggleSetComplete: (sessionId, exerciseId, setId) => {
        const state = get();
        const session = state.sessions.find((item) => item.id === sessionId);
        const exercise = session?.exercises.find((item) => item.id === exerciseId);
        const setItem = exercise?.sets.find((item) => item.id === setId);
        if (!session || !exercise || !setItem) return;
        const completed = !setItem.completed;
        set({
          sessions: updateSession(state.sessions, sessionId, (current) =>
            updateSessionExercise(current, exerciseId, (currentExercise) => ({
              ...currentExercise,
              sets: currentExercise.sets.map((item) => (item.id === setId ? { ...item, completed } : item)),
            })),
          ),
        });
        if (completed && state.settings.autoRest) {
          state.startRestTimer(exercise.restSec, exercise.exerciseId);
        }
      },

      updateSessionExerciseNote: (sessionId, exerciseId, note) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) =>
            updateSessionExercise(session, exerciseId, (exercise) => ({ ...exercise, note })),
          ),
        })),

      addWarmupSets: (sessionId, exerciseId) => {
        const state = get();
        const session = state.sessions.find((item) => item.id === sessionId);
        const exercise = session?.exercises.find((item) => item.id === exerciseId);
        if (!exercise) return 0;
        if (exercise.sets.some((set) => set.type === 'warmup')) return 0;
        const workingWeight =
          exercise.sets.find((set) => set.type === 'normal' && (set.weightKg ?? 0) > 0)?.weightKg ??
          exercise.sets.reduce((best, set) => Math.max(best, set.weightKg ?? 0), 0);
        if (!workingWeight || workingWeight <= 0) return 0;
        const plan = warmupPlan(workingWeight, state.profile.unitSystem);
        if (plan.length === 0) return 0;
        const sets = plan.map((warmup) => ({
          id: createId('set'),
          weightKg: warmup.weightKg,
          reps: warmup.reps,
          completed: false,
          type: 'warmup' as const,
        }));
        set({
          sessions: updateSession(state.sessions, sessionId, (current) =>
            updateSessionExercise(current, exerciseId, (currentExercise) => ({
              ...currentExercise,
              sets: [...sets, ...currentExercise.sets],
            })),
          ),
        });
        return sets.length;
      },

      renameSession: (sessionId, name) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) => ({ ...session, name })),
        })),

      setSessionNotes: (sessionId, notes) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) => ({ ...session, notes })),
        })),

      setSessionBodyweight: (sessionId, bodyweightKg) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) => ({ ...session, bodyweightKg })),
        })),

      finishWorkout: (sessionId) => {
        const state = get();
        const session = state.sessions.find((item) => item.id === sessionId);
        if (!session) return null;
        const cleaned: WorkoutSession = {
          ...session,
          status: 'completed',
          completedAt: new Date().toISOString(),
          exercises: session.exercises
            .map((exercise) => ({
              ...exercise,
              sets: exercise.sets.filter((setItem) => setItem.completed && (setItem.reps ?? 0) > 0),
            }))
            .filter((exercise) => exercise.sets.length > 0),
        };
        set({
          sessions: state.sessions.map((item) => (item.id === sessionId ? cleaned : item)),
          restTimer: null,
        });
        return cleaned;
      },

      discardWorkout: (sessionId) =>
        set((state) => {
          const removed = state.sessions.find((session) => session.id === sessionId);
          const photoIds = new Set(removed?.photoIds ?? []);
          return {
            sessions: state.sessions.filter((session) => session.id !== sessionId),
            sessionPhotos: state.sessionPhotos.filter((photo) => !photoIds.has(photo.id)),
            restTimer: null,
          };
        }),

      deleteSession: (sessionId) =>
        set((state) => {
          const removed = state.sessions.find((session) => session.id === sessionId);
          const photoIds = new Set(removed?.photoIds ?? []);
          return {
            sessions: state.sessions.filter((session) => session.id !== sessionId),
            sessionPhotos: state.sessionPhotos.filter((photo) => !photoIds.has(photo.id)),
          };
        }),

      repeatWorkout: (sessionId) => {
        const state = get();
        const source = state.sessions.find((session) => session.id === sessionId);
        if (!source) return null;
        const active = state.sessions.find((session) => session.status === 'active');
        if (active) return active.id;
        const session: WorkoutSession = {
          ...source,
          id: createId('session'),
          name: `${source.name} · repeat`,
          startedAt: new Date().toISOString(),
          completedAt: undefined,
          status: 'active',
          scheduledDate: todayKey(),
          notes: '',
          photoIds: [],
          exercises: source.exercises.map((exercise) => ({
            ...exercise,
            id: createId('se'),
            sets: exercise.sets.map((setItem) => ({
              id: createId('set'),
              weightKg: setItem.weightKg,
              reps: setItem.reps,
              completed: false,
              type: 'normal',
            })),
          })),
        };
        set({ sessions: [session, ...state.sessions] });
        return session.id;
      },

      addSessionPhoto: async (sessionId, pose, dataUrl) => {
        const id = createId('photo');
        await putPhoto(id, dataUrl);
        cachePhotoUrl(id, dataUrl);
        const photo: SessionPhoto = {
          id,
          pose,
          date: todayKey(),
          sessionId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          sessionPhotos: [photo, ...state.sessionPhotos],
          sessions: updateSession(state.sessions, sessionId, (session) => ({
            ...session,
            photoIds: [...session.photoIds, id],
          })),
        }));
        return photo;
      },

      removeSessionPhoto: async (photoId) => {
        await deletePhoto(photoId);
        set((state) => ({
          sessionPhotos: state.sessionPhotos.filter((photo) => photo.id !== photoId),
          sessions: state.sessions.map((session) => ({
            ...session,
            photoIds: session.photoIds.filter((id) => id !== photoId),
          })),
        }));
      },

      addScheduleRule: (rule) => set((state) => ({ scheduleRules: [...state.scheduleRules, rule] })),

      scheduleWorkout: (programId, programDayId, date, recurrence, weekdays, endDate) => {
        const rule: ScheduleRule = {
          id: createId('rule'),
          programId,
          programDayId,
          startDate: date,
          endDate,
          recurrence,
          weekdays:
            recurrence === 'weekly' || recurrence === 'biweekly' || recurrence === 'custom'
              ? weekdays && weekdays.length > 0
                ? weekdays
                : [new Date(`${date}T12:00:00`).getDay()]
              : [],
          active: true,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ scheduleRules: [...state.scheduleRules, rule] }));
        return rule.id;
      },

      updateScheduleRule: (ruleId, patch) =>
        set((state) => ({
          scheduleRules: state.scheduleRules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
        })),

      deleteScheduleRule: (ruleId) =>
        set((state) => ({ scheduleRules: state.scheduleRules.filter((rule) => rule.id !== ruleId) })),

      toggleScheduleRule: (ruleId) =>
        set((state) => ({
          scheduleRules: state.scheduleRules.map((rule) =>
            rule.id === ruleId ? { ...rule, active: !rule.active } : rule,
          ),
        })),

      addFoodEntry: (entry) => set((state) => ({ foodEntries: [entry, ...state.foodEntries] })),
      updateFoodEntry: (entryId, patch) =>
        set((state) => ({
          foodEntries: state.foodEntries.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)),
        })),
      deleteFoodEntry: (entryId) =>
        set((state) => ({ foodEntries: state.foodEntries.filter((entry) => entry.id !== entryId) })),
      saveMeal: (name, entries) => {
        const items = entries.map((entry) => ({
          name: entry.name,
          servingLabel: entry.servingLabel,
          quantity: entry.quantity,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          foodId: entry.foodId,
        }));
        const meal: SavedMeal = { id: createId('meal'), name, items, createdAt: new Date().toISOString() };
        set((state) => ({ savedMeals: [meal, ...state.savedMeals] }));
        return meal;
      },
      deleteSavedMeal: (mealId) =>
        set((state) => ({ savedMeals: state.savedMeals.filter((meal) => meal.id !== mealId) })),
      logSavedMeal: (mealId, date, mealSlot) => {
        const saved = get().savedMeals.find((meal) => meal.id === mealId);
        if (!saved) return;
        const entries: FoodEntry[] = saved.items.map((item) => ({
          id: createId('food'),
          date,
          meal: mealSlot,
          name: item.name,
          servingLabel: item.servingLabel,
          quantity: item.quantity,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          foodId: item.foodId,
        }));
        set((state) => ({ foodEntries: [...entries, ...state.foodEntries] }));
      },

      copyFoodDay: (fromDate, toDate) => {
        const state = get();
        const source = state.foodEntries.filter((entry) => entry.date === fromDate);
        if (source.length === 0) return 0;
        const copies = source.map((entry) => ({
          ...entry,
          id: createId('food'),
          date: toDate,
        }));
        set({ foodEntries: [...copies, ...state.foodEntries] });
        return copies.length;
      },

      upsertBodyEntry: (entry) => {
        const state = get();
        const existing = state.bodyEntries.find((item) => item.date === entry.date);
        const merged = existing ? { ...entry, id: existing.id } : entry;
        set({
          bodyEntries: existing
            ? state.bodyEntries.map((item) => (item.date === entry.date ? merged : item))
            : [merged, ...state.bodyEntries],
        });
        return merged.id;
      },
      deleteBodyEntry: (entryId) =>
        set((state) => ({ bodyEntries: state.bodyEntries.filter((entry) => entry.id !== entryId) })),

      addGoal: (goal) => set((state) => ({ goals: [goal, ...state.goals] })),
      updateGoal: (goalId, patch) =>
        set((state) => ({ goals: state.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal)) })),
      deleteGoal: (goalId) => set((state) => ({ goals: state.goals.filter((goal) => goal.id !== goalId) })),
      completeGoal: (goalId) =>
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === goalId ? { ...goal, completedAt: goal.completedAt ?? new Date().toISOString() } : goal,
          ),
        })),
      reopenGoal: (goalId) =>
        set((state) => ({
          goals: state.goals.map((goal) => (goal.id === goalId ? { ...goal, completedAt: undefined } : goal)),
        })),

      addCustomExercise: (exercise) =>
        set((state) => ({ customExercises: [exercise, ...state.customExercises] })),
      toggleBookmark: (slug) =>
        set((state) => ({
          articleBookmarks: state.articleBookmarks.includes(slug)
            ? state.articleBookmarks.filter((item) => item !== slug)
            : [slug, ...state.articleBookmarks],
        })),
      dismiss: (key) => set((state) => ({ dismissed: { ...state.dismissed, [key]: true } })),

      startRestTimer: (seconds, label = 'Rest') => {
        const now = Date.now();
        set({
          restTimer: {
            durationSec: seconds,
            startedAt: now,
            endsAt: now + seconds * 1000,
            label,
          },
        });
      },
      adjustRestTimer: (seconds) =>
        set((state) => {
          if (!state.restTimer) return {};
          return {
            restTimer: {
              ...state.restTimer,
              durationSec: Math.max(15, state.restTimer.durationSec + seconds),
              endsAt: Math.max(Date.now(), state.restTimer.endsAt + seconds * 1000),
            },
          };
        }),
      clearRestTimer: () => set({ restTimer: null }),

      exportBundle: async () => {
        const state = get();
        const photos: Record<string, string> = {};
        for (const photo of state.sessionPhotos) {
          const data = await getPhoto(photo.id);
          if (data) photos[photo.id] = data;
        }
        const { ...data } = state;
        return {
          app: 'form',
          version: 1,
          exportedAt: new Date().toISOString(),
          state: {
            profile: data.profile,
            settings: data.settings,
            programs: data.programs,
            sessions: data.sessions,
            scheduleRules: data.scheduleRules,
            sessionPhotos: data.sessionPhotos,
            customExercises: data.customExercises,
            food: data.foodEntries,
            savedMeals: data.savedMeals,
            bodyEntries: data.bodyEntries,
            goals: data.goals,
            articleBookmarks: data.articleBookmarks,
          },
          photos,
        };
      },

      importBundle: async (bundle) => {
        if (!bundle || bundle.app !== 'form') throw new Error('This is not a FORM backup file.');
        await clearPhotos();
        if (bundle.photos) {
          for (const [id, dataUrl] of Object.entries(bundle.photos)) {
            await putPhoto(id, dataUrl);
            cachePhotoUrl(id, dataUrl);
          }
        }
        const s = bundle.state;
        set({
          profile: s.profile,
          settings: { ...DEFAULT_SETTINGS, ...s.settings },
          programs: s.programs ?? [],
          sessions: s.sessions ?? [],
          scheduleRules: s.scheduleRules ?? [],
          sessionPhotos: s.sessionPhotos ?? [],
          customExercises: s.customExercises ?? [],
          foodEntries: s.food ?? [],
          savedMeals: s.savedMeals ?? [],
          bodyEntries: s.bodyEntries ?? [],
          goals: s.goals ?? [],
          articleBookmarks: s.articleBookmarks ?? [],
          dismissed: {},
          restTimer: null,
        });
      },

      resetToSeed: async () => {
        await clearPhotos();
        set(createInitialData());
      },

      loadDemoHistory: () => set((state) => generateDemoHistory(state)),

      removeSampleData: () =>
        set((state) => ({
          sessions: state.sessions.filter((session) => !session.isSample),
          bodyEntries: state.bodyEntries.filter((entry) => !entry.isSample),
        })),

      replaceData: (data) => set(data),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        profile: state.profile,
        settings: state.settings,
        programs: state.programs,
        sessions: state.sessions,
        scheduleRules: state.scheduleRules,
        sessionPhotos: state.sessionPhotos,
        customExercises: state.customExercises,
        foodEntries: state.foodEntries,
        savedMeals: state.savedMeals,
        bodyEntries: state.bodyEntries,
        goals: state.goals,
        articleBookmarks: state.articleBookmarks,
        dismissed: state.dismissed,
        restTimer: state.restTimer,
      }),
    },
  ),
);

export function getActiveSession(state: AppStore): WorkoutSession | undefined {
  return state.sessions.find((session) => session.status === 'active');
}

export function getAllExercises(state: AppStore): Exercise[] {
  return state.customExercises;
}
