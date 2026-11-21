import { useMemo, useState } from 'react';
import { Dumbbell, Search, SlidersHorizontal } from 'lucide-react';
import { EXERCISES, EQUIPMENT_LABELS, MUSCLE_LABELS } from '../data/exercises';
import type { Exercise, MuscleGroup } from '../types';
import { useAppStore } from '../store/appStore';
import { Sheet } from './ui/Sheet';

type MuscleFilter = 'all' | 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core';

const FILTERS: Array<{ value: MuscleFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'legs', label: 'Legs' },
  { value: 'core', label: 'Core' },
];

const GROUP_MUSCLES: Record<Exclude<MuscleFilter, 'all'>, MuscleGroup[]> = {
  chest: ['chest'],
  back: ['back'],
  shoulders: ['shoulders'],
  arms: ['biceps', 'triceps', 'forearms'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  core: ['core'],
};

function matchesGroup(exercise: Exercise, filter: MuscleFilter): boolean {
  if (filter === 'all') return true;
  const muscles = GROUP_MUSCLES[filter];
  return exercise.primary.some((muscle) => muscles.includes(muscle));
}

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  title?: string;
  subtitle?: string;
  excludeIds?: string[];
  customExercises?: Exercise[];
}

export function ExercisePicker({
  open,
  onClose,
  onSelect,
  title = 'Add an exercise',
  subtitle,
  excludeIds = [],
  customExercises = [],
}: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MuscleFilter>('all');
  const storeCustom = useAppStore((state) => state.customExercises);
  const all = useMemo(() => [...customExercises, ...storeCustom, ...EXERCISES], [customExercises, storeCustom]);
  const unique = useMemo(() => {
    const seen = new Set<string>();
    return all.filter((exercise) => {
      if (seen.has(exercise.id)) return false;
      seen.add(exercise.id);
      return true;
    });
  }, [all]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return unique
      .filter((exercise) => !excludeIds.includes(exercise.id))
      .filter((exercise) => matchesGroup(exercise, filter))
      .filter((exercise) => {
        if (!needle) return true;
        const haystack = [
          exercise.name,
          ...exercise.primary.map((muscle) => MUSCLE_LABELS[muscle]),
          ...exercise.secondary.map((muscle) => MUSCLE_LABELS[muscle]),
          EQUIPMENT_LABELS[exercise.equipment],
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [unique, excludeIds, filter, query]);

  return (
    <Sheet open={open} onClose={onClose} title={title} subtitle={subtitle ?? `${results.length} exercises`}>
      <div className="exercise-search">
        <Search size={17} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search exercises, muscles, equipment"
          aria-label="Search exercises"
          autoComplete="off"
        />
        {query && (
          <button type="button" className="btn btn-xs btn-ghost" onClick={() => setQuery('')}>
            Clear
          </button>
        )}
      </div>

      <div className="scroll-x" style={{ padding: '10px 0 12px' }}>
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className="chip chip-sm"
            data-active={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
        <span className="chip chip-sm chip-ghost" aria-hidden="true">
          <SlidersHorizontal size={12} /> {EQUIPMENT_LABELS[unique[0]?.equipment ?? 'barbell']}
        </span>
      </div>

      {results.length === 0 ? (
        <div className="exercise-empty">
          <Dumbbell size={22} />
          <p className="strong">No exercise matches that search</p>
          <p className="small muted">Try a different muscle group or a simpler phrase.</p>
        </div>
      ) : (
        <div className="list">
          {results.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              className="exercise-row"
              onClick={() => {
                onSelect(exercise);
                onClose();
              }}
            >
              <span className="exercise-thumb">
                <Dumbbell />
              </span>
              <span className="grow">
                <span className="exercise-name">{exercise.name}</span>
                <span className="exercise-meta">
                  {exercise.primary.map((muscle) => MUSCLE_LABELS[muscle]).join(' · ')}
                  <span aria-hidden="true"> · </span>
                  {EQUIPMENT_LABELS[exercise.equipment]}
                </span>
              </span>
              <span className="badge">{exercise.mechanic === 'compound' ? 'Compound' : 'Isolation'}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
