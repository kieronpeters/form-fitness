export type UnitSystem = 'metric' | 'imperial';
export type ThemeMode = 'dark' | 'light' | 'system';
export type FitnessGoal = 'build' | 'lose' | 'strength' | 'consistency';
export type ExperienceLevel = 'new' | 'returning' | 'experienced';
export type Sex = 'male' | 'female' | 'other';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'full_body';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other';

export type MovementPattern =
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'isolation'
  | 'core'
  | 'carry';

export interface Exercise {
  id: string;
  name: string;
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  equipment: Equipment;
  pattern: MovementPattern;
  mechanic: 'compound' | 'isolation';
  difficulty: 1 | 2 | 3;
  description: string;
  cues: string[];
  alternatives: string[];
  isCustom?: boolean;
}

export interface Profile {
  id: string;
  name: string;
  avatarUrl?: string;
  goal: FitnessGoal;
  experience: ExperienceLevel;
  sex?: Sex;
  birthYear?: number;
  heightCm?: number;
  weightKg?: number;
  weeklyTarget: number;
  unitSystem: UnitSystem;
  bio?: string;
  createdAt: string;
}

export interface Settings {
  theme: ThemeMode;
  defaultRestSec: number;
  autoRest: boolean;
  firstDayOfWeek: 0 | 1;
  showRPE: boolean;
  hapticFeedback: boolean;
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface ProgramExercise {
  id: string;
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
  note?: string;
}

export interface ProgramDay {
  id: string;
  name: string;
  focus: string;
  exercises: ProgramExercise[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  level: ExperienceLevel;
  goal: FitnessGoal;
  daysPerWeek: number;
  days: ProgramDay[];
  isExample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SetType = 'normal' | 'warmup';

export interface SessionSet {
  id: string;
  weightKg: number | null;
  reps: number | null;
  rpe?: number | null;
  completed: boolean;
  type: SetType;
}

export interface SessionExercise {
  id: string;
  exerciseId: string;
  sets: SessionSet[];
  restSec: number;
  note?: string;
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  replacedFromId?: string;
}

export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface WorkoutSession {
  id: string;
  name: string;
  programId?: string;
  programDayId?: string;
  scheduledDate?: string;
  scheduledRuleId?: string;
  startedAt: string;
  completedAt?: string;
  status: SessionStatus;
  exercises: SessionExercise[];
  notes?: string;
  bodyweightKg?: number;
  photoIds: string[];
  isSample?: boolean;
}

export type Recurrence = 'once' | 'daily' | 'weekly' | 'biweekly' | 'custom';

export interface ScheduleRule {
  id: string;
  programId: string;
  programDayId: string;
  startDate: string;
  endDate?: string;
  recurrence: Recurrence;
  /** 0 = Sunday … 6 = Saturday. Used by weekly, biweekly and custom. */
  weekdays: number[];
  active: boolean;
  createdAt: string;
}

export interface ScheduleOccurrence {
  key: string;
  date: string;
  ruleId: string;
  programId: string;
  programDayId: string;
  programName: string;
  dayName: string;
  focus: string;
  exerciseCount: number;
  estimatedMinutes: number;
  completedSessionId?: string;
  isOverride?: boolean;
}

export interface SessionPhoto {
  id: string;
  pose: 'front' | 'side' | 'free';
  date: string;
  sessionId?: string;
  caption?: string;
  createdAt: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  date: string;
  meal: MealSlot;
  name: string;
  servingLabel: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodId?: string;
}

export interface Food {
  id: string;
  name: string;
  category: 'protein' | 'carbs' | 'fruit-veg' | 'fats' | 'dairy' | 'drinks' | 'meals' | 'snacks';
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SavedMealItem {
  name: string;
  servingLabel: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodId?: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  items: SavedMealItem[];
  createdAt: string;
}

export type MeasurementKey =
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'waist'
  | 'hips'
  | 'leftArm'
  | 'rightArm'
  | 'leftThigh'
  | 'rightThigh'
  | 'calves';

export interface BodyEntry {
  id: string;
  date: string;
  weightKg?: number;
  measurements: Partial<Record<MeasurementKey, number>>;
  energy?: number;
  sleepHours?: number;
  soreness?: number;
  mood?: number;
  notes?: string;
  createdAt: string;
  isSample?: boolean;
}

export type GoalKind = 'workouts' | 'volume' | 'streak' | 'bodyweight' | 'exercise' | 'custom';

export interface Goal {
  id: string;
  title: string;
  kind: GoalKind;
  target: number;
  startingValue?: number;
  exerciseId?: string;
  unit: string;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
  note?: string;
}

export interface ArticleSource {
  label: string;
  url: string;
}

export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Article {
  slug: string;
  title: string;
  category: 'Training' | 'Nutrition' | 'Recovery' | 'Mindset';
  readMinutes: number;
  excerpt: string;
  featured?: boolean;
  sections: ArticleSection[];
  tips?: string[];
  sources?: ArticleSource[];
  videoLinks?: ArticleSource[];
  accent: 'lime' | 'coral' | 'blue' | 'violet' | 'gold';
}

export interface PersonalRecord {
  exerciseId: string;
  weightKg: number;
  reps: number;
  estimated1RM: number;
  date: string;
  sessionId: string;
}

export interface WeeklyPoint {
  weekStart: string;
  workouts: number;
  volumeKg: number;
  durationMin: number;
  sets: number;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ExportBundle {
  app: 'form';
  version: 1;
  exportedAt: string;
  state: {
    profile: Profile;
    settings: Settings;
    programs: Program[];
    sessions: WorkoutSession[];
    scheduleRules: ScheduleRule[];
    sessionPhotos: SessionPhoto[];
    customExercises: Exercise[];
    food: FoodEntry[];
    savedMeals: SavedMeal[];
    bodyEntries: BodyEntry[];
    goals: Goal[];
    articleBookmarks: string[];
  };
  photos?: Record<string, string>;
}
