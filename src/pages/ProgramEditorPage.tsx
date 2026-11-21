import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Dumbbell,
  GripVertical,
  Plus,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ExercisePicker } from '../components/ExercisePicker';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { Sheet } from '../components/ui/Sheet';
import { ScheduleSheet } from '../components/ScheduleSheet';
import { getExercise } from '../data/exercises';
import { todayKey } from '../lib/date';
import { toast } from '../store/toastStore';
import type { ExperienceLevel, FitnessGoal, ProgramExercise } from '../types';

export function ProgramEditorPage() {
  const { programId = '' } = useParams();
  const navigate = useNavigate();
  const programs = useAppStore((state) => state.programs);
  const updateProgram = useAppStore((state) => state.updateProgram);
  const addProgramDay = useAppStore((state) => state.addProgramDay);
  const updateProgramDay = useAppStore((state) => state.updateProgramDay);
  const deleteProgramDay = useAppStore((state) => state.deleteProgramDay);
  const moveProgramDay = useAppStore((state) => state.moveProgramDay);
  const duplicateProgramDay = useAppStore((state) => state.duplicateProgramDay);
  const addExerciseToDay = useAppStore((state) => state.addExerciseToDay);
  const updateProgramExercise = useAppStore((state) => state.updateProgramExercise);
  const deleteProgramExercise = useAppStore((state) => state.deleteProgramExercise);
  const moveProgramExercise = useAppStore((state) => state.moveProgramExercise);
  const deleteProgram = useAppStore((state) => state.deleteProgram);

  const program = programs.find((item) => item.id === programId);

  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [deleteDayId, setDeleteDayId] = useState<string | null>(null);
  const [deleteProgramOpen, setDeleteProgramOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<{ dayId: string; exerciseId: string; note: string } | null>(null);
  const [scheduleDayId, setScheduleDayId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const dayCount = program?.days.length ?? 0;
  const totalExercises = useMemo(
    () => program?.days.reduce((sum, day) => sum + day.exercises.length, 0) ?? 0,
    [program],
  );

  if (!program) {
    return (
      <div className="page-enter">
        <PageHeader title="Programme not found" back="/workouts" />
        <EmptyState icon={<Dumbbell />} title="Nothing to edit" text="This programme may have been deleted." />
      </div>
    );
  }

  const updateExercise = (dayId: string, exercise: ProgramExercise, patch: Partial<ProgramExercise>) => {
    updateProgramExercise(program.id, dayId, exercise.id, patch);
  };

  const toggleExpanded = (dayId: string) => {
    setExpanded((current) => ({ ...current, [dayId]: !current[dayId] }));
  };

  return (
    <div className="page-enter editor-page">
      <PageHeader
        eyebrow="Programme editor"
        title={program.name}
        subtitle="Changes save automatically on this device."
        back={`/programs/${program.id}`}
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setScheduleDayId(program.days[0]?.id ?? null);
              }}
              disabled={program.days.length === 0}
            >
              <CalendarDays /> Schedule
            </button>
            <Link to={`/programs/${program.id}`} className="btn btn-primary btn-sm">
              <Check /> Done
            </Link>
          </>
        }
      />

      <div className="editor-layout">
        <aside className="editor-meta card">
          <div className="field">
            <label className="field-label" htmlFor="edit-name">
              Programme name
            </label>
            <input
              id="edit-name"
              className="input"
              value={program.name}
              onChange={(event) => updateProgram(program.id, { name: event.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="edit-description">
              Description
            </label>
            <textarea
              id="edit-description"
              className="textarea"
              rows={4}
              value={program.description}
              onChange={(event) => updateProgram(program.id, { description: event.target.value })}
            />
          </div>
          <div className="inline-fields">
            <div className="field">
              <label className="field-label" htmlFor="edit-level">
                Level
              </label>
              <select
                id="edit-level"
                className="select"
                value={program.level}
                onChange={(event) => updateProgram(program.id, { level: event.target.value as ExperienceLevel })}
              >
                <option value="new">New</option>
                <option value="returning">Returning</option>
                <option value="experienced">Experienced</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="edit-goal">
                Goal
              </label>
              <select
                id="edit-goal"
                className="select"
                value={program.goal}
                onChange={(event) => updateProgram(program.id, { goal: event.target.value as FitnessGoal })}
              >
                <option value="build">Build muscle</option>
                <option value="lose">Lose fat</option>
                <option value="strength">Get stronger</option>
                <option value="consistency">Stay consistent</option>
              </select>
            </div>
          </div>
          <div className="editor-summary">
            <span>
              <b>{dayCount}</b> days
            </span>
            <span>
              <b>{totalExercises}</b> exercises
            </span>
          </div>
          <div className="info-note">
            <CalendarDays />
            <span>Schedule a day, then set it to repeat weekly or daily from the calendar.</span>
          </div>
        </aside>

        <div className="editor-days">
          <div className="between" style={{ marginBottom: 12 }}>
            <h2 className="section-title">Training days</h2>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                const id = addProgramDay(program.id, `Day ${program.days.length + 1}`, 'Full body');
                if (id) setExpanded((current) => ({ ...current, [id]: true }));
              }}
            >
              <Plus /> Add day
            </button>
          </div>

          {program.days.length === 0 ? (
            <EmptyState
              icon={<Dumbbell />}
              title="Add your first training day"
              text="A day holds the exercises, sets and reps for one session."
              action={
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => addProgramDay(program.id, 'Day 1', 'Full body')}
                >
                  <Plus /> Add day
                </button>
              }
            />
          ) : (
            <div className="stack">
              {program.days.map((day, dayIndex) => {
                const isOpen = expanded[day.id] ?? true;
                return (
                  <article className="editor-day card" key={day.id}>
                    <div className="editor-day-head">
                      <span className="drag-handle" aria-hidden="true">
                        <GripVertical size={16} />
                      </span>
                      <div className="grow">
                        <input
                          className="editor-day-name"
                          value={day.name}
                          aria-label="Day name"
                          onChange={(event) => updateProgramDay(program.id, day.id, { name: event.target.value })}
                        />
                        <input
                          className="editor-day-focus"
                          value={day.focus}
                          aria-label="Day focus"
                          placeholder="Focus (e.g. Push · chest, shoulders, triceps)"
                          onChange={(event) => updateProgramDay(program.id, day.id, { focus: event.target.value })}
                        />
                      </div>
                      <div className="editor-day-actions">
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => moveProgramDay(program.id, day.id, -1)}
                          disabled={dayIndex === 0}
                          aria-label="Move day up"
                        >
                          <ArrowUp />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => moveProgramDay(program.id, day.id, 1)}
                          disabled={dayIndex === program.days.length - 1}
                          aria-label="Move day down"
                        >
                          <ArrowDown />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => toggleExpanded(day.id)}
                          aria-label={isOpen ? 'Collapse day' : 'Expand day'}
                          aria-expanded={isOpen}
                        >
                          <ChevronDown style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 160ms' }} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => {
                            const id = duplicateProgramDay(program.id, day.id);
                            if (id) {
                              setExpanded((current) => ({ ...current, [id]: true }));
                              toast('Training day duplicated.', 'success');
                            }
                          }}
                          aria-label="Duplicate day"
                        >
                          <Copy />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => setDeleteDayId(day.id)}
                          aria-label="Delete day"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="editor-day-body">
                        {day.exercises.length === 0 ? (
                          <p className="tiny muted" style={{ padding: '8px 0 12px' }}>
                            No exercises yet. Add one below.
                          </p>
                        ) : (
                          <div className="editor-exercises">
                            <div className="editor-exercise-head">
                              <span>Exercise</span>
                              <span>Sets</span>
                              <span>Reps</span>
                              <span>Rest</span>
                              <span />
                            </div>
                            {day.exercises.map((exercise, exerciseIndex) => {
                              const info = getExercise(exercise.exerciseId);
                              return (
                                <div className="editor-exercise" key={exercise.id}>
                                  <div className="editor-exercise-name-cell">
                                    <Link to={`/library/${exercise.exerciseId}`} className="editor-exercise-name">
                                      {info?.name ?? 'Unknown exercise'}
                                    </Link>
                                    <span className="editor-exercise-meta">
                                      {info?.primary.join(' · ').replaceAll('_', ' ')}
                                    </span>
                                    {exercise.note && <span className="editor-exercise-note">{exercise.note}</span>}
                                  </div>
                                  <label className="editor-num">
                                    <span className="sr-only">Sets for {info?.name}</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={12}
                                      value={exercise.sets}
                                      onChange={(event) =>
                                        updateExercise(day.id, exercise, { sets: Math.max(1, Number(event.target.value) || 1) })
                                      }
                                    />
                                  </label>
                                  <div className="editor-reps">
                                    <label className="editor-num">
                                      <span className="sr-only">Minimum reps</span>
                                      <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={exercise.repsMin}
                                        onChange={(event) =>
                                          updateExercise(day.id, exercise, {
                                            repsMin: Math.max(1, Number(event.target.value) || 1),
                                            repsMax: Math.max(Number(event.target.value) || 1, exercise.repsMax),
                                          })
                                        }
                                      />
                                    </label>
                                    <span className="muted">–</span>
                                    <label className="editor-num">
                                      <span className="sr-only">Maximum reps</span>
                                      <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={exercise.repsMax}
                                        onChange={(event) =>
                                          updateExercise(day.id, exercise, {
                                            repsMax: Math.max(exercise.repsMin, Number(event.target.value) || exercise.repsMin),
                                          })
                                        }
                                      />
                                    </label>
                                  </div>
                                  <label className="editor-num">
                                    <span className="sr-only">Rest seconds</span>
                                    <input
                                      type="number"
                                      min={15}
                                      max={600}
                                      step={15}
                                      value={exercise.restSec}
                                      onChange={(event) =>
                                        updateExercise(day.id, exercise, { restSec: Math.max(15, Number(event.target.value) || 15) })
                                      }
                                    />
                                    <small>s</small>
                                  </label>
                                  <div className="editor-exercise-actions">
                                    <button
                                      type="button"
                                      className="icon-btn icon-btn-sm"
                                      onClick={() => setNoteTarget({ dayId: day.id, exerciseId: exercise.id, note: exercise.note ?? '' })}
                                      aria-label="Edit exercise note"
                                    >
                                      <StickyNote />
                                    </button>
                                    <button
                                      type="button"
                                      className="icon-btn icon-btn-sm"
                                      onClick={() => moveProgramExercise(program.id, day.id, exercise.id, -1)}
                                      disabled={exerciseIndex === 0}
                                      aria-label="Move exercise up"
                                    >
                                      <ArrowUp />
                                    </button>
                                    <button
                                      type="button"
                                      className="icon-btn icon-btn-sm"
                                      onClick={() => moveProgramExercise(program.id, day.id, exercise.id, 1)}
                                      disabled={exerciseIndex === day.exercises.length - 1}
                                      aria-label="Move exercise down"
                                    >
                                      <ArrowDown />
                                    </button>
                                    <button
                                      type="button"
                                      className="icon-btn icon-btn-sm"
                                      onClick={() => deleteProgramExercise(program.id, day.id, exercise.id)}
                                      aria-label="Remove exercise"
                                    >
                                      <Trash2 />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="editor-day-footer">
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setPickerDayId(day.id)}>
                            <Plus /> Add exercise
                          </button>
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setScheduleDayId(day.id)}>
                            <CalendarDays /> Schedule this day
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <div className="editor-danger">
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteProgramOpen(true)}>
              <Trash2 /> Delete programme
            </button>
          </div>
        </div>
      </div>

      <ExercisePicker
        open={Boolean(pickerDayId)}
        onClose={() => setPickerDayId(null)}
        title="Add exercise"
        subtitle="Pick a lift for this training day."
        onSelect={(exercise) => {
          if (pickerDayId) addExerciseToDay(program.id, pickerDayId, exercise.id);
        }}
      />

      <ConfirmSheet
        open={Boolean(deleteDayId)}
        onClose={() => setDeleteDayId(null)}
        title="Delete this training day?"
        message="The day and its exercise list will be removed from this programme. Logged workouts are unaffected."
        confirmLabel="Delete day"
        danger
        onConfirm={() => {
          if (deleteDayId) deleteProgramDay(program.id, deleteDayId);
          toast('Training day deleted.', 'success');
        }}
      />

      <ConfirmSheet
        open={deleteProgramOpen}
        onClose={() => setDeleteProgramOpen(false)}
        title="Delete this programme?"
        message="Repeating calendar entries for this programme will also be removed. Logged workouts stay in history."
        confirmLabel="Delete programme"
        danger
        onConfirm={() => {
          deleteProgram(program.id);
          toast('Programme deleted.', 'success');
          navigate('/workouts');
        }}
      />

      <Sheet
        open={Boolean(noteTarget)}
        onClose={() => setNoteTarget(null)}
        title="Exercise note"
        subtitle="A cue, tempo or reminder for this slot."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNoteTarget(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary grow"
              onClick={() => {
                if (noteTarget) {
                  updateProgramExercise(program.id, noteTarget.dayId, noteTarget.exerciseId, {
                    note: noteTarget.note.trim() || undefined,
                  });
                  setNoteTarget(null);
                  toast('Note saved.', 'success');
                }
              }}
            >
              Save note
            </button>
          </>
        }
      >
        {noteTarget && (
          <div className="field">
            <label className="field-label" htmlFor="exercise-note">
              Note
            </label>
            <textarea
              id="exercise-note"
              className="textarea"
              value={noteTarget.note}
              onChange={(event) => setNoteTarget({ ...noteTarget, note: event.target.value })}
              placeholder="e.g. 2 sec eccentric, leave 1 rep in reserve"
              autoFocus
            />
          </div>
        )}
      </Sheet>

      <ScheduleSheet
        open={Boolean(scheduleDayId)}
        onClose={() => setScheduleDayId(null)}
        programId={program.id}
        programDayId={scheduleDayId}
        date={todayKey()}
      />
    </div>
  );
}
