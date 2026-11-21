import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  Check,
  Ellipsis,
  Flame,
  GripVertical,
  Lightbulb,
  Minus,
  Plus,
  Repeat,
  StickyNote,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type { SessionSet, WorkoutSession } from '../../types';
import { useAppStore } from '../../store/appStore';
import { getExercise, MUSCLE_LABELS } from '../../data/exercises';
import { lastExercisePerformance, previousSetValue, formatTargetReps } from '../../lib/workout';
import { getProgressionSuggestion } from '../../lib/progression';
import { formatWeight, formatWeightValue, weightUnit } from '../../lib/units';
import { SetValueInput } from './SetValueInput';
import { Sheet } from '../ui/Sheet';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { ExercisePicker } from '../ExercisePicker';
import { PlateCalculator } from './PlateCalculator';
import { toast } from '../../store/toastStore';

interface SessionExerciseCardProps {
  session: WorkoutSession;
  sessionExercise: WorkoutSession['exercises'][number];
  allSessions: WorkoutSession[];
}

export function SessionExerciseCard({ session, sessionExercise, allSessions }: SessionExerciseCardProps) {
  const updateSet = useAppStore((state) => state.updateSet);
  const toggleSetComplete = useAppStore((state) => state.toggleSetComplete);
  const addSet = useAppStore((state) => state.addSet);
  const addWarmupSets = useAppStore((state) => state.addWarmupSets);
  const removeSet = useAppStore((state) => state.removeSet);
  const removeSessionExercise = useAppStore((state) => state.removeSessionExercise);
  const swapSessionExercise = useAppStore((state) => state.swapSessionExercise);
  const updateSessionExerciseNote = useAppStore((state) => state.updateSessionExerciseNote);
  const customExercises = useAppStore((state) => state.customExercises);
  const units = useAppStore((state) => state.profile.unitSystem);
  const showRPE = useAppStore((state) => state.settings.showRPE);

  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(sessionExercise.note ?? '');
  const [swapOpen, setSwapOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [setMenuId, setSetMenuId] = useState<string | null>(null);
  const [rpeDraft, setRpeDraft] = useState('');
  const [plateOpen, setPlateOpen] = useState(false);

  const exercise = getExercise(sessionExercise.exerciseId, customExercises);
  const previous = lastExercisePerformance(allSessions, sessionExercise.exerciseId, session.id);
  const progression = exercise
    ? getProgressionSuggestion({
        exercise,
        previous,
        targetRepsMin: sessionExercise.targetRepsMin ?? 8,
        targetRepsMax: sessionExercise.targetRepsMax ?? 10,
        units,
      })
    : null;
  const completed = sessionExercise.sets.filter((set) => set.completed).length;
  const selectedSet = sessionExercise.sets.find((set) => set.id === setMenuId) ?? null;
  const workingWeight =
    sessionExercise.sets.find((set) => set.type === 'normal' && (set.weightKg ?? 0) > 0)?.weightKg ??
    sessionExercise.sets.reduce((best, set) => Math.max(best, set.weightKg ?? 0), 0);
  const hasWarmups = sessionExercise.sets.some((set) => set.type === 'warmup');
  const weightStep = units === 'imperial' ? 5 / 2.2046226218 : 2.5;

  const handleToggle = (set: SessionSet) => {
    if (!set.completed && (set.reps == null || set.reps <= 0)) {
      toast('Add reps before completing the set.', 'error');
      return;
    }
    toggleSetComplete(session.id, sessionExercise.id, set.id);
  };

  const adjustAllWeights = (delta: number) => {
    sessionExercise.sets.forEach((set) => {
      const base = set.weightKg ?? 0;
      const next = Math.max(0, Math.round((base + delta) * 10) / 10);
      updateSet(session.id, sessionExercise.id, set.id, { weightKg: next });
    });
    toast(`Adjusted all sets by ${formatWeight(Math.abs(delta), units)}.`, 'success');
  };

  const openSetMenu = (set: SessionSet) => {
    setSetMenuId(set.id);
    setRpeDraft(set.rpe ? String(set.rpe) : '');
  };

  return (
    <article className="session-exercise">
      <div className="session-ex-head">
        <span className="drag-handle" aria-hidden="true">
          <GripVertical size={15} />
        </span>
        <div className="grow">
          <Link to={`/library/${sessionExercise.exerciseId}`} className="session-ex-title">
            {exercise?.name ?? 'Exercise'}
          </Link>
          <div className="session-ex-sub">
            <span>
              Target <b>{sessionExercise.targetSets ?? sessionExercise.sets.length} × {formatTargetReps(sessionExercise.targetRepsMin ?? 8, sessionExercise.targetRepsMax ?? 10)}</b>
            </span>
            <span>
              Rest <b>{sessionExercise.restSec}s</b>
            </span>
            {exercise && <span className="muted">{exercise.primary.map((muscle) => MUSCLE_LABELS[muscle]).join(' · ')}</span>}
          </div>
          {previous ? (
            <div className="session-ex-sub">
              <span>
                Last <b>{new Date(previous.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</b> ·{' '}
                {previous.sets
                  .slice(0, 4)
                  .map((set) => `${formatWeightValue(set.weightKg, units, 1) || 'BW'}×${set.reps ?? 0}`)
                  .join(', ')}
              </span>
              <TrendingUp size={12} className="muted" />
            </div>
          ) : (
            <div className="session-ex-sub">
              <span className="muted">First time — set the baseline.</span>
            </div>
          )}
          {progression && (
            <p className="progression-hint" data-tone={progression.tone}>
              <Lightbulb /> {progression.message}
            </p>
          )}
          {sessionExercise.note && <p className="session-ex-notes">{sessionExercise.note}</p>}
        </div>
        <div className="row" style={{ gap: 4 }}>
          <span className="badge badge-lime">
            {completed}/{sessionExercise.sets.length}
          </span>
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={() => setMenuOpen(true)}
            aria-label={`Options for ${exercise?.name ?? 'exercise'}`}
          >
            <Ellipsis />
          </button>
        </div>
      </div>

      <div className="set-table">
        <div className="set-head">
          <span>Set</span>
          <span>{weightUnit(units)}</span>
          <span>Reps</span>
          <span className="sr-only">Complete</span>
        </div>
        {sessionExercise.sets.map((set, index) => {
          const previousSet = previousSetValue(previous, index);
          const previousWeight = previousSet?.weightKg;
          const weightPlaceholder =
            previousWeight != null && previousWeight > 0
              ? formatWeightValue(previousWeight, units, 1)
              : exercise?.equipment === 'bodyweight'
                ? 'BW'
                : '—';
          return (
            <div
              className="set-row"
              key={set.id}
              data-completed={set.completed}
              data-warmup={set.type === 'warmup'}
            >
              <button type="button" className="set-index" onClick={() => openSetMenu(set)} aria-label={`Set ${index + 1} options`}>
                {set.type === 'warmup' ? <small>W</small> : index + 1}
                {set.rpe ? <small style={{ color: 'var(--gold)', textTransform: 'none' }}>{set.rpe}</small> : null}
              </button>
              <SetValueInput
                value={set.weightKg}
                placeholder={weightPlaceholder}
                suffix={weightUnit(units)}
                ariaLabel={`Weight for set ${index + 1}`}
                onCommit={(value) => updateSet(session.id, sessionExercise.id, set.id, { weightKg: value })}
              />
              <SetValueInput
                value={set.reps}
                placeholder={previousSet?.reps ? String(previousSet.reps) : String(sessionExercise.targetRepsMin ?? '')}
                ariaLabel={`Reps for set ${index + 1}`}
                onCommit={(value) => updateSet(session.id, sessionExercise.id, set.id, { reps: value == null ? null : Math.round(value) })}
              />
              <button
                type="button"
                className="set-check"
                data-done={set.completed}
                onClick={() => handleToggle(set)}
                aria-label={set.completed ? `Mark set ${index + 1} incomplete` : `Complete set ${index + 1}`}
                aria-pressed={set.completed}
              >
                <Check />
              </button>
            </div>
          );
        })}
      </div>

      <div className="session-ex-footer">
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => addSet(session.id, sessionExercise.id)}>
          <Plus /> Add set
        </button>
        <span className="tiny muted" style={{ alignSelf: 'center' }}>
          Tap the box when a set is done — rest starts automatically.
        </span>
      </div>

      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={exercise?.name ?? 'Exercise options'}
        subtitle="Quick actions for this exercise."
      >
        <div className="sheet-action-list">
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              setNoteDraft(sessionExercise.note ?? '');
              setMenuOpen(false);
              setNoteOpen(true);
            }}
          >
            <StickyNote /> {sessionExercise.note ? 'Edit note' : 'Add a note'}
          </button>
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              setMenuOpen(false);
              if (hasWarmups) {
                toast('Warm-up sets are already in this exercise.', 'error');
                return;
              }
              const added = addWarmupSets(session.id, sessionExercise.id);
              toast(
                added > 0 ? `${added} warm-up sets added.` : 'Add a working weight first, then generate warm-ups.',
                added > 0 ? 'success' : 'error',
              );
            }}
          >
            <Flame /> Add warm-up sets
          </button>
          {exercise?.equipment === 'barbell' && (
            <button
              type="button"
              className="sheet-action"
              onClick={() => {
                setMenuOpen(false);
                setPlateOpen(true);
              }}
            >
              <Calculator /> Plate calculator
            </button>
          )}
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              setMenuOpen(false);
              setSwapOpen(true);
            }}
          >
            <Repeat /> Replace exercise
          </button>
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              adjustAllWeights(weightStep);
              setMenuOpen(false);
            }}
          >
            <Plus /> Add {formatWeight(weightStep, units)} to all sets
          </button>
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              adjustAllWeights(-weightStep);
              setMenuOpen(false);
            }}
          >
            <Minus /> Remove {formatWeight(weightStep, units)} from all sets
          </button>
          <button
            type="button"
            className="sheet-action sheet-action-danger"
            onClick={() => {
              setMenuOpen(false);
              setConfirmRemove(true);
            }}
          >
            <Trash2 /> Remove exercise
          </button>
        </div>
      </Sheet>

      <Sheet
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Exercise note"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNoteOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary grow"
              onClick={() => {
                updateSessionExerciseNote(session.id, sessionExercise.id, noteDraft.trim());
                setNoteOpen(false);
                toast('Note saved.', 'success');
              }}
            >
              Save note
            </button>
          </>
        }
      >
        <div className="field">
          <label className="field-label" htmlFor={`note-${sessionExercise.id}`}>
            Note for this exercise
          </label>
          <textarea
            id={`note-${sessionExercise.id}`}
            className="textarea"
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Tempo, seat height, cues, how it felt…"
            autoFocus
          />
        </div>
      </Sheet>

      <Sheet
        open={Boolean(selectedSet)}
        onClose={() => setSetMenuId(null)}
        title={`Set options`}
        subtitle={selectedSet ? `Set ${sessionExercise.sets.findIndex((set) => set.id === selectedSet.id) + 1}` : undefined}
      >
        {selectedSet && (
          <div className="stack">
            <button
              type="button"
              className="sheet-action"
              onClick={() => {
                updateSet(session.id, sessionExercise.id, selectedSet.id, {
                  type: selectedSet.type === 'warmup' ? 'normal' : 'warmup',
                });
                setSetMenuId(null);
              }}
            >
              <Flame /> {selectedSet.type === 'warmup' ? 'Mark as working set' : 'Mark as warm-up set'}
            </button>
            {showRPE && (
              <div className="field">
                <label className="field-label" htmlFor="rpe-input">
                  Effort (RPE 1–10)
                </label>
                <div className="row">
                  <input
                    id="rpe-input"
                    className="input"
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={rpeDraft}
                    onChange={(event) => setRpeDraft(event.target.value)}
                    placeholder="e.g. 8"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const value = Number(rpeDraft);
                      updateSet(session.id, sessionExercise.id, selectedSet.id, {
                        rpe: Number.isFinite(value) && value >= 1 && value <= 10 ? value : null,
                      });
                      setSetMenuId(null);
                    }}
                  >
                    Save
                  </button>
                </div>
                <p className="field-hint">8 means two reps left in reserve. Optional.</p>
              </div>
            )}
            <button
              type="button"
              className="sheet-action sheet-action-danger"
              onClick={() => {
                removeSet(session.id, sessionExercise.id, selectedSet.id);
                setSetMenuId(null);
              }}
            >
              <Trash2 /> Remove set
            </button>
          </div>
        )}
      </Sheet>

      <ExercisePicker
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        title="Replace exercise"
        subtitle="Swap the movement but keep your place in the session."
        onSelect={(replacement) => {
          swapSessionExercise(session.id, sessionExercise.id, replacement.id);
          toast(`Swapped to ${replacement.name}.`, 'success');
        }}
      />

      <PlateCalculator
        open={plateOpen}
        onClose={() => setPlateOpen(false)}
        initialWeightKg={workingWeight > 0 ? workingWeight : null}
        units={units}
      />

      <ConfirmSheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove this exercise?"
        message="Any logged sets for this exercise will be removed from the session. You can add it again at any time."
        confirmLabel="Remove exercise"
        danger
        onConfirm={() => removeSessionExercise(session.id, sessionExercise.id)}
      />
    </article>
  );
}
