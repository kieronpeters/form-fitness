import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Dumbbell, Plus, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { EXERCISES, EQUIPMENT_LABELS, MUSCLE_COLORS, MUSCLE_LABELS, MUSCLE_ORDER } from '../data/exercises';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Sheet } from '../components/ui/Sheet';
import { useAppStore } from '../store/appStore';
import { createId } from '../lib/ids';
import { toast } from '../store/toastStore';
import type { Equipment, Exercise, MuscleGroup } from '../types';

export function ExerciseLibraryPage() {
  const customExercises = useAppStore((state) => state.customExercises);
  const addCustomExercise = useAppStore((state) => state.addCustomExercise);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all');
  const [equipment, setEquipment] = useState<Equipment | 'all'>('all');
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const [customEquipment, setCustomEquipment] = useState<Equipment>('machine');

  const all = useMemo(() => [...customExercises, ...EXERCISES], [customExercises]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all
      .filter((exercise) => muscle === 'all' || exercise.primary.includes(muscle) || exercise.secondary.includes(muscle))
      .filter((exercise) => equipment === 'all' || exercise.equipment === equipment)
      .filter((exercise) => {
        if (!needle) return true;
        return [exercise.name, ...exercise.primary.map((item) => MUSCLE_LABELS[item]), ...exercise.secondary.map((item) => MUSCLE_LABELS[item])]
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all, muscle, equipment, query]);

  const handleCreateCustom = () => {
    const name = customName.trim();
    if (!name) {
      toast('Give your exercise a name.', 'error');
      return;
    }
    const exercise: Exercise = {
      id: createId('custom'),
      name,
      primary: [customMuscle],
      secondary: [],
      equipment: customEquipment,
      pattern: 'isolation',
      mechanic: 'isolation',
      difficulty: 1,
      description: 'A custom exercise you added. Add your own cues in the programme notes.',
      cues: [],
      alternatives: [],
      isCustom: true,
    };
    addCustomExercise(exercise);
    setCustomOpen(false);
    setCustomName('');
    toast('Custom exercise added.', 'success');
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Library"
        title="Exercises"
        subtitle="Search by muscle, equipment or name. Every lift includes technique cues and alternatives."
        actions={
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCustomOpen(true)}>
            <Plus /> Custom
          </button>
        }
      />

      <div className="library-toolbar card card-sm">
        <div className="exercise-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search exercises…"
            aria-label="Search exercises"
            autoComplete="off"
          />
        </div>
        <div className="library-filters">
          <div className="scroll-x" aria-label="Filter by muscle">
            <button type="button" className="chip chip-sm" data-active={muscle === 'all'} onClick={() => setMuscle('all')}>
              All muscles
            </button>
            {MUSCLE_ORDER.filter((item) => item !== 'full_body').map((item) => (
              <button
                key={item}
                type="button"
                className="chip chip-sm"
                data-active={muscle === item}
                onClick={() => setMuscle(item)}
              >
                <span className="muscle-dot" style={{ background: MUSCLE_COLORS[item] }} />
                {MUSCLE_LABELS[item]}
              </button>
            ))}
          </div>
          <div className="equipment-filter">
            <SlidersHorizontal size={15} />
            <select
              className="select select-compact"
              value={equipment}
              onChange={(event) => setEquipment(event.target.value as Equipment | 'all')}
              aria-label="Filter by equipment"
            >
              <option value="all">All equipment</option>
              {Object.entries(EQUIPMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="between" style={{ margin: '18px 0 10px' }}>
        <p className="small muted">
          <b className="text-2">{results.length}</b> exercises
        </p>
        {(query || muscle !== 'all' || equipment !== 'all') && (
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={() => {
              setQuery('');
              setMuscle('all');
              setEquipment('all');
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No exercises found"
          text="Try a different muscle group or a shorter search."
          action={
            <button type="button" className="btn btn-secondary" onClick={() => {
              setQuery('');
              setMuscle('all');
              setEquipment('all');
            }}>
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="library-grid">
          {results.map((exercise) => (
            <Link to={`/library/${exercise.id}`} key={exercise.id} className="card card-sm exercise-card card-interactive">
              <div className="exercise-card-top">
                <span className="exercise-thumb">
                  <Dumbbell />
                </span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="exercise-name">{exercise.name}</span>
                  <span className="exercise-meta">
                    {exercise.primary.map((item) => MUSCLE_LABELS[item]).join(' · ')} · {EQUIPMENT_LABELS[exercise.equipment]}
                  </span>
                </span>
                <span className="badge">{exercise.isCustom ? 'Custom' : exercise.mechanic}</span>
                <ChevronRight size={16} className="muted" />
              </div>
              <div className="tag-row mt-2">
                {exercise.primary.slice(0, 2).map((item) => (
                  <span className="muscle-tag" key={item}>
                    <span className="muscle-dot" style={{ background: MUSCLE_COLORS[item] }} />
                    {MUSCLE_LABELS[item]}
                  </span>
                ))}
                <span className="muscle-tag">{exercise.difficulty === 1 ? 'Beginner friendly' : exercise.difficulty === 2 ? 'Intermediate' : 'Advanced'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="info-note mt-4">
        <Sparkles />
        <span>
          Every exercise in your programmes links back here. Use alternatives when a machine is busy or a movement
          doesn’t agree with you.
        </span>
      </div>

      <Sheet
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title="Add a custom exercise"
        subtitle="For machines, gym-specific stations or movements we don’t have yet."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setCustomOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary grow" onClick={handleCreateCustom}>
              Add exercise
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="custom-name">
              Exercise name
            </label>
            <input
              id="custom-name"
              className="input"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="e.g. Gym-specific chest press"
              autoFocus
            />
          </div>
          <div className="inline-fields">
            <div className="field">
              <label className="field-label" htmlFor="custom-muscle">
                Primary muscle
              </label>
              <select
                id="custom-muscle"
                className="select"
                value={customMuscle}
                onChange={(event) => setCustomMuscle(event.target.value as MuscleGroup)}
              >
                {MUSCLE_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {MUSCLE_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="custom-equipment">
                Equipment
              </label>
              <select
                id="custom-equipment"
                className="select"
                value={customEquipment}
                onChange={(event) => setCustomEquipment(event.target.value as Equipment)}
              >
                {Object.entries(EQUIPMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
