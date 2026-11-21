import type { FoodEntry, MealSlot, NutritionTotals, Profile, Settings } from '../types';

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmr: number;
  tdee: number;
  source: 'estimated' | 'custom';
}

const ACTIVITY_FACTORS: Record<number, number> = {
  2: 1.35,
  3: 1.45,
  4: 1.5,
  5: 1.6,
  6: 1.65,
  7: 1.7,
};

export function calculateBMR(profile: Profile): number {
  const weight = profile.weightKg ?? 78;
  const height = profile.heightCm ?? 175;
  const age = profile.birthYear ? Math.max(16, new Date().getFullYear() - profile.birthYear) : 30;
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (profile.sex === 'male') return Math.round(base + 5);
  if (profile.sex === 'female') return Math.round(base - 161);
  return Math.round(base - 78);
}

export function nutritionTargets(profile: Profile, settings: Settings): NutritionTargets {
  const bmr = calculateBMR(profile);
  const factor = ACTIVITY_FACTORS[Math.min(7, Math.max(2, profile.weeklyTarget))] ?? 1.5;
  const tdee = Math.round(bmr * factor);
  let calories = tdee;

  if (profile.goal === 'lose') calories = Math.round(tdee * 0.82);
  else if (profile.goal === 'build') calories = Math.round(tdee * 1.08);
  else if (profile.goal === 'strength') calories = Math.round(tdee * 1.04);
  else calories = tdee;

  calories = Math.max(1400, calories);

  const proteinPerKg =
    profile.goal === 'lose' ? 2.2 : profile.goal === 'build' ? 1.9 : profile.goal === 'strength' ? 1.8 : 1.6;
  const weight = profile.weightKg ?? 78;
  let protein = Math.round(weight * proteinPerKg);
  let fat = Math.round((calories * 0.27) / 9);
  fat = Math.max(fat, Math.round(weight * 0.6));
  let carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  let source: NutritionTargets['source'] = 'estimated';
  if (settings.nutrition.calories) {
    calories = settings.nutrition.calories;
    source = 'custom';
  }
  if (settings.nutrition.protein) {
    protein = settings.nutrition.protein;
    source = 'custom';
  }
  if (settings.nutrition.fat) {
    fat = settings.nutrition.fat;
    source = 'custom';
  }
  if (settings.nutrition.carbs) {
    carbs = settings.nutrition.carbs;
    source = 'custom';
  }

  return { calories, protein, carbs, fat, bmr, tdee, source };
}

export function macroTotals(entries: FoodEntry[]): NutritionTotals {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function roundMacros(totals: NutritionTotals): NutritionTotals {
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
}

export function entriesForDate(entries: FoodEntry[], date: string): FoodEntry[] {
  return entries.filter((entry) => entry.date === date);
}

export function entriesForMeal(entries: FoodEntry[], date: string, meal: MealSlot): FoodEntry[] {
  return entries.filter((entry) => entry.date === date && entry.meal === meal);
}

export function scaleFood(
  food: { calories: number; protein: number; carbs: number; fat: number },
  quantity: number,
): NutritionTotals {
  return {
    calories: food.calories * quantity,
    protein: food.protein * quantity,
    carbs: food.carbs * quantity,
    fat: food.fat * quantity,
  };
}

export function dailyCaloriesSeries(entries: FoodEntry[], days: string[]): Array<{ date: string; calories: number; protein: number }> {
  return days.map((date) => {
    const totals = macroTotals(entriesForDate(entries, date));
    return { date, calories: Math.round(totals.calories), protein: Math.round(totals.protein) };
  });
}

export function macroPercentages(totals: NutritionTotals): { protein: number; carbs: number; fat: number } {
  const proteinCalories = totals.protein * 4;
  const carbCalories = totals.carbs * 4;
  const fatCalories = totals.fat * 9;
  const total = proteinCalories + carbCalories + fatCalories;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((proteinCalories / total) * 100),
    carbs: Math.round((carbCalories / total) * 100),
    fat: Math.round((fatCalories / total) * 100),
  };
}
