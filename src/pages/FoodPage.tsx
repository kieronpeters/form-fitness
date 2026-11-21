import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  Cookie,
  Copy,
  CupSoda,
  Drumstick,
  Droplets,
  Ellipsis,
  Flame,
  Milk,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { ProgressRing } from '../components/ui/ProgressRing';
import { BarChart } from '../components/charts/Charts';
import { FOODS, FOOD_CATEGORY_LABELS, MEAL_LABELS } from '../data/foods';
import type { Food, FoodEntry, MealSlot } from '../types';
import {
  dailyCaloriesSeries,
  entriesForDate,
  macroTotals,
  nutritionTargets,
  roundMacros,
  scaleFood,
} from '../lib/nutrition';
import { lastNDays } from '../lib/stats';
import { addDaysKey, toDisplayDate, todayKey } from '../lib/date';
import { createId } from '../lib/ids';
import { toast } from '../store/toastStore';

const MEAL_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_ICONS: Record<MealSlot, typeof Apple> = {
  breakfast: Sparkles,
  lunch: UtensilsCrossed,
  dinner: Flame,
  snack: Cookie,
};

const CATEGORY_ICONS: Record<Food['category'], typeof Apple> = {
  protein: Drumstick,
  carbs: Wheat,
  'fruit-veg': Apple,
  fats: Droplets,
  dairy: Milk,
  drinks: CupSoda,
  meals: UtensilsCrossed,
  snacks: Cookie,
};

export function FoodPage() {
  const profile = useAppStore((state) => state.profile);
  const settings = useAppStore((state) => state.settings);
  const foodEntries = useAppStore((state) => state.foodEntries);
  const savedMeals = useAppStore((state) => state.savedMeals);
  const addFoodEntry = useAppStore((state) => state.addFoodEntry);
  const updateFoodEntry = useAppStore((state) => state.updateFoodEntry);
  const deleteFoodEntry = useAppStore((state) => state.deleteFoodEntry);
  const saveMeal = useAppStore((state) => state.saveMeal);
  const deleteSavedMeal = useAppStore((state) => state.deleteSavedMeal);
  const logSavedMeal = useAppStore((state) => state.logSavedMeal);
  const copyFoodDay = useAppStore((state) => state.copyFoodDay);

  const [date, setDate] = useState(todayKey());
  const [addOpen, setAddOpen] = useState(false);
  const [mealPreset, setMealPreset] = useState<MealSlot>('breakfast');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Food['category'] | 'all'>('all');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', meal: 'snack' as MealSlot });
  const [entryMenu, setEntryMenu] = useState<FoodEntry | null>(null);
  const [editQty, setEditQty] = useState(1);
  const [saveMealSlot, setSaveMealSlot] = useState<MealSlot | null>(null);
  const [saveMealName, setSaveMealName] = useState('');
  const [savedMealToLog, setSavedMealToLog] = useState<string | null>(null);
  const [savedMealSlot, setSavedMealSlot] = useState<MealSlot>('lunch');
  const [savedMealDelete, setSavedMealDelete] = useState<string | null>(null);

  const targets = nutritionTargets(profile, settings);
  const dayEntries = entriesForDate(foodEntries, date);
  const previousDate = addDaysKey(date, -1);
  const previousDayCount = entriesForDate(foodEntries, previousDate).length;
  const totals = roundMacros(macroTotals(dayEntries));
  const calorieProgress = Math.min(1.4, totals.calories / Math.max(1, targets.calories));
  const caloriesLeft = targets.calories - totals.calories;
  const weekCalories = useMemo(
    () => dailyCaloriesSeries(foodEntries, lastNDays(7)).map((point) => ({
      label: new Date(`${point.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      value: point.calories,
    })),
    [foodEntries],
  );

  const foods = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return FOODS.filter((food) => category === 'all' || food.category === category)
      .filter((food) => !needle || food.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [search, category]);

  const openAdd = (meal: MealSlot) => {
    setMealPreset(meal);
    setSelectedFood(null);
    setSearch('');
    setCategory('all');
    setAddOpen(true);
  };

  const selectFood = (food: Food) => {
    setSelectedFood(food);
    setQuantity(1);
  };

  const confirmFood = () => {
    if (!selectedFood) return;
    const scaled = scaleFood(selectedFood, quantity);
    addFoodEntry({
      id: createId('food'),
      date,
      meal: mealPreset,
      name: selectedFood.name,
      servingLabel: selectedFood.servingLabel,
      quantity,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      foodId: selectedFood.id,
    });
    toast(`${selectedFood.name} added to ${MEAL_LABELS[mealPreset].toLowerCase()}.`, 'success');
    setAddOpen(false);
    setSelectedFood(null);
  };

  const confirmQuickAdd = () => {
    const name = quickForm.name.trim();
    const calories = Number(quickForm.calories);
    if (!name || !Number.isFinite(calories) || calories < 0) {
      toast('Add a name and calories for the quick entry.', 'error');
      return;
    }
    addFoodEntry({
      id: createId('food'),
      date,
      meal: quickForm.meal,
      name,
      servingLabel: 'Quick entry',
      quantity: 1,
      calories,
      protein: Number(quickForm.protein) || 0,
      carbs: Number(quickForm.carbs) || 0,
      fat: Number(quickForm.fat) || 0,
    });
    setQuickOpen(false);
    setQuickForm({ name: '', calories: '', protein: '', carbs: '', fat: '', meal: 'snack' });
    toast('Quick entry added.', 'success');
  };

  const confirmEditQuantity = () => {
    if (!entryMenu) return;
    const factor = editQty / Math.max(0.1, entryMenu.quantity);
    updateFoodEntry(entryMenu.id, {
      quantity: editQty,
      calories: entryMenu.calories * factor,
      protein: entryMenu.protein * factor,
      carbs: entryMenu.carbs * factor,
      fat: entryMenu.fat * factor,
    });
    setEntryMenu(null);
    toast('Serving updated.', 'success');
  };

  const startSaveMeal = (meal: MealSlot) => {
    const entries = dayEntries.filter((entry) => entry.meal === meal);
    setSaveMealSlot(meal);
    setSaveMealName(`${MEAL_LABELS[meal]} · ${toDisplayDate(date)}`);
    if (entries.length === 0) toast('Add some food first.', 'error');
  };

  const handleSaveMeal = () => {
    if (!saveMealSlot) return;
    const entries = dayEntries.filter((entry) => entry.meal === saveMealSlot);
    if (entries.length === 0) return;
    saveMeal(saveMealName.trim() || MEAL_LABELS[saveMealSlot], entries);
    setSaveMealSlot(null);
    toast('Meal saved for later.', 'success');
  };

  const openSavedMeal = (mealId: string) => {
    setSavedMealToLog(mealId);
    setSavedMealSlot('lunch');
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Nutrition"
        title="Food diary"
        subtitle="A practical view of calories and macros. Log the meal, not the perfection."
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm hide-xs" onClick={() => setQuickOpen(true)}>
              <Sparkles /> Quick add
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openAdd('breakfast')}>
              <Plus /> Add food
            </button>
          </>
        }
      />

      <div className="food-date-bar">
        <button type="button" className="icon-btn icon-btn-sm icon-btn-bordered" onClick={() => setDate(addDaysKey(date, -1))} aria-label="Previous day">
          <ChevronLeft />
        </button>
        <div className="food-date-center">
          <p className="eyebrow">{date === todayKey() ? 'Today' : 'Diary'}</p>
          <h2 className="food-date-title">{toDisplayDate(date)}</h2>
        </div>
        <button type="button" className="icon-btn icon-btn-sm icon-btn-bordered" onClick={() => setDate(addDaysKey(date, 1))} aria-label="Next day">
          <ChevronRight />
        </button>
      </div>
      <div className="food-date-tools">
        <button
          type="button"
          className="btn btn-xs btn-ghost"
          disabled={previousDayCount === 0}
          onClick={() => {
            const copied = copyFoodDay(previousDate, date);
            toast(
              copied > 0 ? `${copied} ${copied === 1 ? 'entry' : 'entries'} copied from ${toDisplayDate(previousDate)}.` : 'No food logged the previous day.',
              copied > 0 ? 'success' : 'error',
            );
          }}
          title={previousDayCount === 0 ? 'No entries on the previous day' : 'Copy all food from the previous day'}
        >
          <Copy size={13} /> Copy previous day {previousDayCount > 0 ? `(${previousDayCount})` : ''}
        </button>
        {date !== todayKey() && (
          <button type="button" className="btn btn-xs btn-ghost" onClick={() => setDate(todayKey())}>
            Back to today
          </button>
        )}
      </div>

      <div className="food-grid">
        <div className="food-main">
          <section className="card food-summary">
            <div className="food-summary-top">
              <ProgressRing
                value={Math.min(1, calorieProgress)}
                size={104}
                stroke={9}
                number={String(totals.calories)}
                label={`/ ${targets.calories} kcal`}
                tone={caloriesLeft < 0 ? 'var(--coral)' : 'var(--accent)'}
                ariaLabel={`${totals.calories} of ${targets.calories} calories`}
              />
              <div className="grow">
                <p className="eyebrow">Daily target</p>
                <p className="chart-value">{targets.calories.toLocaleString('en-US')} kcal</p>
                <p className="tiny muted">
                  {caloriesLeft >= 0
                    ? `${caloriesLeft.toLocaleString('en-US')} kcal left · ${Math.round((totals.protein / Math.max(1, targets.protein)) * 100)}% protein`
                    : `${Math.abs(caloriesLeft).toLocaleString('en-US')} kcal over target`}
                </p>
                <div className="food-macro-bars">
                  {[
                    { label: 'Protein', value: totals.protein, target: targets.protein, tone: 'lime' },
                    { label: 'Carbs', value: totals.carbs, target: targets.carbs, tone: 'blue' },
                    { label: 'Fat', value: totals.fat, target: targets.fat, tone: 'gold' },
                  ].map((macro) => (
                    <div className="macro-row" key={macro.label}>
                      <div className="macro-row-head">
                        <span>{macro.label}</span>
                        <span>
                          <strong>{macro.value}</strong> / {macro.target} g
                        </span>
                      </div>
                      <span className="bar">
                        <span
                          className="bar-fill"
                          data-tone={macro.tone === 'lime' ? undefined : macro.tone}
                          style={{ width: `${Math.min(100, (macro.value / Math.max(1, macro.target)) * 100)}%` }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="food-summary-foot">
              <Link to="/profile" className="section-link">
                Targets are estimated from your profile · edit in Profile <ChevronRight size={13} />
              </Link>
            </div>
          </section>

          <div className="stack">
            {MEAL_ORDER.map((meal) => {
              const entries = dayEntries.filter((entry) => entry.meal === meal);
              const mealTotals = roundMacros(macroTotals(entries));
              const Icon = MEAL_ICONS[meal];
              return (
                <section className="meal-card card" key={meal}>
                  <div className="meal-head">
                    <span className={`entity-icon entity-icon-${meal === 'breakfast' ? 'gold' : meal === 'lunch' ? 'lime' : meal === 'dinner' ? 'violet' : 'coral'}`}>
                      <Icon />
                    </span>
                    <div className="grow">
                      <h3 className="meal-title">{MEAL_LABELS[meal]}</h3>
                      <p className="tiny muted">
                        {entries.length} {entries.length === 1 ? 'item' : 'items'} · {mealTotals.calories} kcal · {mealTotals.protein}g protein
                      </p>
                    </div>
                    {entries.length > 0 && (
                      <button type="button" className="icon-btn icon-btn-sm" onClick={() => startSaveMeal(meal)} aria-label={`Save ${meal} as a meal`}>
                        <Ellipsis />
                      </button>
                    )}
                    <button type="button" className="btn btn-xs btn-secondary" onClick={() => openAdd(meal)}>
                      <Plus /> Add
                    </button>
                  </div>

                  {entries.length === 0 ? (
                    <button type="button" className="meal-empty" onClick={() => openAdd(meal)}>
                      <Plus size={15} />
                      <span>Add {MEAL_LABELS[meal].toLowerCase()} — search foods or quick add</span>
                    </button>
                  ) : (
                    <div className="meal-entries">
                      {entries.map((entry) => (
                        <button
                          type="button"
                          className="meal-entry"
                          key={entry.id}
                          onClick={() => {
                            setEntryMenu(entry);
                            setEditQty(entry.quantity);
                          }}
                        >
                          <span className="meal-entry-main">
                            <span className="strong small">{entry.name}</span>
                            <span className="tiny muted">
                              {entry.quantity !== 1 ? `${Number(entry.quantity.toFixed(2))} × ` : ''}
                              {entry.servingLabel} · P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F {Math.round(entry.fat)}g
                            </span>
                          </span>
                          <span className="meal-entry-kcal">{Math.round(entry.calories)}</span>
                          <ChevronRight size={14} className="muted" />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <div className="food-quick-row">
            <button type="button" className="btn btn-secondary" onClick={() => setQuickOpen(true)}>
              <Sparkles /> Quick add calories
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setMealPreset('snack');
                setAddOpen(true);
              }}
            >
              <Search /> Browse foods
            </button>
          </div>
        </div>

        <aside className="food-aside">
          <section className="card">
            <div className="between">
              <div>
                <p className="eyebrow">Last 7 days</p>
                <p className="chart-value">{Math.round(weekCalories.reduce((sum, item) => sum + item.value, 0) / 7)}</p>
                <p className="tiny muted">avg. kcal / day</p>
              </div>
            </div>
            <div className="mt-3">
              <BarChart points={weekCalories} height={120} formatValue={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`)} emptyLabel="Log food to see the last seven days." />
            </div>
          </section>

          <section className="card">
            <div className="between" style={{ marginBottom: 10 }}>
              <div>
                <p className="eyebrow">Saved meals</p>
                <p className="small strong" style={{ marginTop: 2 }}>
                  Repeat what works
                </p>
              </div>
              <span className="badge">{savedMeals.length}</span>
            </div>
            {savedMeals.length === 0 ? (
              <p className="tiny muted">
                Save a meal from today’s diary and reuse it in one tap. The “…” next to a meal does it.
              </p>
            ) : (
              <div className="stack-sm">
                {savedMeals.slice(0, 6).map((meal) => (
                  <div className="saved-meal-row" key={meal.id}>
                    <span className="entity-icon entity-icon-coral">
                      <UtensilsCrossed />
                    </span>
                    <span className="grow">
                      <span className="strong small">{meal.name}</span>
                      <span className="tiny muted">
                        {meal.items.length} items · {Math.round(meal.items.reduce((sum, item) => sum + item.calories, 0))} kcal
                      </span>
                    </span>
                    <button type="button" className="btn btn-xs btn-secondary" onClick={() => openSavedMeal(meal.id)}>
                      Log
                    </button>
                    <button type="button" className="icon-btn icon-btn-sm" onClick={() => setSavedMealDelete(meal.id)} aria-label="Delete saved meal">
                      <Trash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <p className="eyebrow">A note on targets</p>
            <p className="small text-2 mt-2" style={{ lineHeight: 1.55 }}>
              Targets use the Mifflin–St Jeor estimate and your weekly training goal. They are a starting point, not a
              prescription. Adjust them in Profile if your weight trend says otherwise.
            </p>
            <Link to="/learn/protein-how-much" className="section-link mt-2" style={{ paddingLeft: 0 }}>
              Read about protein <ChevronRight size={13} />
            </Link>
          </section>
        </aside>
      </div>

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={selectedFood ? 'Add servings' : 'Add food'}
        subtitle={selectedFood ? selectedFood.name : `Adding to ${MEAL_LABELS[mealPreset].toLowerCase()}`}
      >
        {selectedFood ? (
          <div>
            <button type="button" className="btn btn-xs btn-ghost" onClick={() => setSelectedFood(null)}>
              <ChevronLeft size={13} /> Back to search
            </button>
            <div className="food-detail-head mt-3">
              <span className="entity-icon entity-icon-lime">
                {(() => {
                  const Icon = CATEGORY_ICONS[selectedFood.category];
                  return <Icon />;
                })()}
              </span>
              <div>
                <p className="strong">{selectedFood.name}</p>
                <p className="tiny muted">
                  {selectedFood.servingLabel} · {selectedFood.calories} kcal · P {selectedFood.protein}g · C {selectedFood.carbs}g · F{' '}
                  {selectedFood.fat}g
                </p>
              </div>
            </div>

            <div className="field mt-4">
              <span className="field-label">Servings</span>
              <div className="quantity-row">
                {[0.5, 1, 1.5, 2, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="chip"
                    data-active={quantity === value}
                    onClick={() => setQuantity(value)}
                  >
                    {value}×
                  </button>
                ))}
              </div>
              <input
                type="number"
                className="input mt-2"
                min={0.1}
                step={0.5}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(0.1, Number(event.target.value) || 0.1))}
                aria-label="Custom serving quantity"
              />
            </div>

            <div className="food-macro-preview">
              {(() => {
                const scaled = scaleFood(selectedFood, quantity);
                return (
                  <>
                    <div>
                      <span className="stat-value">{Math.round(scaled.calories)}</span>
                      <span className="stat-label">kcal</span>
                    </div>
                    <div>
                      <span className="stat-value">{Math.round(scaled.protein)}g</span>
                      <span className="stat-label">protein</span>
                    </div>
                    <div>
                      <span className="stat-value">{Math.round(scaled.carbs)}g</span>
                      <span className="stat-label">carbs</span>
                    </div>
                    <div>
                      <span className="stat-value">{Math.round(scaled.fat)}g</span>
                      <span className="stat-label">fat</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="field mt-3">
              <span className="field-label">Meal</span>
              <div className="meal-choice-row">
                {MEAL_ORDER.map((meal) => (
                  <button key={meal} type="button" className="chip chip-sm" data-active={mealPreset === meal} onClick={() => setMealPreset(meal)}>
                    {MEAL_LABELS[meal]}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="btn btn-primary btn-block mt-4" onClick={confirmFood}>
              <Plus /> Add to {MEAL_LABELS[mealPreset].toLowerCase()} · {Math.round(scaleFood(selectedFood, quantity).calories)} kcal
            </button>
          </div>
        ) : (
          <div>
            <div className="exercise-search">
              <Search size={17} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search foods…"
                aria-label="Search foods"
                autoFocus
              />
            </div>
            <div className="scroll-x" style={{ padding: '10px 0 12px' }}>
              <button type="button" className="chip chip-sm" data-active={category === 'all'} onClick={() => setCategory('all')}>
                All
              </button>
              {(Object.keys(FOOD_CATEGORY_LABELS) as Array<Food['category']>).map((item) => (
                <button key={item} type="button" className="chip chip-sm" data-active={category === item} onClick={() => setCategory(item)}>
                  {FOOD_CATEGORY_LABELS[item]}
                </button>
              ))}
            </div>
            <div className="stack-sm">
              {foods.map((food) => {
                const Icon = CATEGORY_ICONS[food.category];
                return (
                  <button type="button" className="food-row" key={food.id} onClick={() => selectFood(food)}>
                    <span className="exercise-thumb">
                      <Icon />
                    </span>
                    <span className="grow">
                      <span className="strong small">{food.name}</span>
                      <span className="tiny muted">
                        {food.servingLabel} · P {food.protein}g · C {food.carbs}g · F {food.fat}g
                      </span>
                    </span>
                    <span className="meal-entry-kcal">{food.calories}</span>
                    <Plus size={15} className="muted" />
                  </button>
                );
              })}
              {foods.length === 0 && <p className="small muted">No foods match that search.</p>}
            </div>
            <button type="button" className="btn btn-secondary btn-block mt-3" onClick={() => {
              setAddOpen(false);
              setQuickOpen(true);
            }}>
              <Sparkles /> Can’t find it? Quick add calories
            </button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        title="Quick add"
        subtitle="For meals you don’t want to weigh or search."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setQuickOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary grow" onClick={confirmQuickAdd}>
              Add entry
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="quick-name">
              What did you eat?
            </label>
            <input
              id="quick-name"
              className="input"
              value={quickForm.name}
              onChange={(event) => setQuickForm({ ...quickForm, name: event.target.value })}
              placeholder="e.g. Lunch with friends"
              autoFocus
            />
          </div>
          <div className="inline-fields">
            <div className="field">
              <label className="field-label" htmlFor="quick-calories">
                Calories
              </label>
              <input
                id="quick-calories"
                className="input"
                inputMode="numeric"
                value={quickForm.calories}
                onChange={(event) => setQuickForm({ ...quickForm, calories: event.target.value.replace(/[^\d]/g, '') })}
                placeholder="650"
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="quick-meal">
                Meal
              </label>
              <select
                id="quick-meal"
                className="select"
                value={quickForm.meal}
                onChange={(event) => setQuickForm({ ...quickForm, meal: event.target.value as MealSlot })}
              >
                {MEAL_ORDER.map((meal) => (
                  <option key={meal} value={meal}>
                    {MEAL_LABELS[meal]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <span className="field-label">Macros (optional)</span>
            <div className="inline-fields" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <input
                className="input"
                inputMode="numeric"
                value={quickForm.protein}
                onChange={(event) => setQuickForm({ ...quickForm, protein: event.target.value.replace(/[^\d]/g, '') })}
                placeholder="Protein g"
                aria-label="Protein grams"
              />
              <input
                className="input"
                inputMode="numeric"
                value={quickForm.carbs}
                onChange={(event) => setQuickForm({ ...quickForm, carbs: event.target.value.replace(/[^\d]/g, '') })}
                placeholder="Carbs g"
                aria-label="Carbs grams"
              />
              <input
                className="input"
                inputMode="numeric"
                value={quickForm.fat}
                onChange={(event) => setQuickForm({ ...quickForm, fat: event.target.value.replace(/[^\d]/g, '') })}
                placeholder="Fat g"
                aria-label="Fat grams"
              />
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={Boolean(entryMenu)}
        onClose={() => setEntryMenu(null)}
        title={entryMenu?.name ?? 'Food entry'}
        subtitle={entryMenu ? `${MEAL_LABELS[entryMenu.meal]} · ${entryMenu.servingLabel}` : undefined}
      >
        {entryMenu && (
          <div className="stack">
            <div className="food-macro-preview">
              <div>
                <span className="stat-value">{Math.round(entryMenu.calories)}</span>
                <span className="stat-label">kcal</span>
              </div>
              <div>
                <span className="stat-value">{Math.round(entryMenu.protein)}g</span>
                <span className="stat-label">protein</span>
              </div>
              <div>
                <span className="stat-value">{Math.round(entryMenu.carbs)}g</span>
                <span className="stat-label">carbs</span>
              </div>
              <div>
                <span className="stat-value">{Math.round(entryMenu.fat)}g</span>
                <span className="stat-label">fat</span>
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="entry-quantity">
                Servings
              </label>
              <div className="row">
                <input
                  id="entry-quantity"
                  className="input"
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={editQty}
                  onChange={(event) => setEditQty(Math.max(0.1, Number(event.target.value) || 0.1))}
                />
                <button type="button" className="btn btn-primary" onClick={confirmEditQuantity}>
                  Update
                </button>
              </div>
            </div>
            <button
              type="button"
              className="sheet-action sheet-action-danger"
              onClick={() => {
                deleteFoodEntry(entryMenu.id);
                setEntryMenu(null);
                toast('Food entry removed.', 'success');
              }}
            >
              <Trash2 /> Remove entry
            </button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={Boolean(saveMealSlot)}
        onClose={() => setSaveMealSlot(null)}
        title="Save this meal"
        subtitle="It will appear in saved meals for one-tap logging later."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setSaveMealSlot(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary grow" onClick={handleSaveMeal}>
              Save meal
            </button>
          </>
        }
      >
        <div className="field">
          <label className="field-label" htmlFor="saved-meal-name">
            Meal name
          </label>
          <input
            id="saved-meal-name"
            className="input"
            value={saveMealName}
            onChange={(event) => setSaveMealName(event.target.value)}
            autoFocus
          />
        </div>
      </Sheet>

      <Sheet
        open={Boolean(savedMealToLog)}
        onClose={() => setSavedMealToLog(null)}
        title="Log saved meal"
        subtitle={`Adding to ${MEAL_LABELS[savedMealSlot].toLowerCase()} on ${toDisplayDate(date)}.`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setSavedMealToLog(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary grow"
              onClick={() => {
                if (savedMealToLog) {
                  logSavedMeal(savedMealToLog, date, savedMealSlot);
                  toast('Saved meal logged.', 'success');
                  setSavedMealToLog(null);
                }
              }}
            >
              Log it
            </button>
          </>
        }
      >
        <div className="meal-choice-row">
          {MEAL_ORDER.map((meal) => (
            <button key={meal} type="button" className="chip chip-sm" data-active={savedMealSlot === meal} onClick={() => setSavedMealSlot(meal)}>
              {MEAL_LABELS[meal]}
            </button>
          ))}
        </div>
      </Sheet>

      <ConfirmSheet
        open={Boolean(savedMealDelete)}
        onClose={() => setSavedMealDelete(null)}
        title="Delete saved meal?"
        message="This shortcut will be removed. The food entries already in your diary are not affected."
        confirmLabel="Delete meal"
        danger
        onConfirm={() => {
          if (savedMealDelete) {
            deleteSavedMeal(savedMealDelete);
            toast('Saved meal deleted.', 'success');
          }
        }}
      />
    </div>
  );
}
