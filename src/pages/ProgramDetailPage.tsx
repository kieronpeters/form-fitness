import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Copy,
  Dumbbell,
  Layers,
  MoreHorizontal,
  Pencil,
  Play,
  Repeat,
  Trash2,
  Users,
} from 'lucide-react';
import { useAppStore, getActiveSession } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { EmptyState } from '../components/ui/EmptyState';
import { ScheduleSheet } from '../components/ScheduleSheet';
import { getExercise, MUSCLE_LABELS } from '../data/exercises';
import { estimateProgramDayMinutes, formatTargetReps } from '../lib/workout';
import { programSetCount } from '../lib/program';
import { recurrenceLabel } from '../lib/schedule';
import { todayKey } from '../lib/date';
import { toast } from '../store/toastStore';

export function ProgramDetailPage() {
  const { programId = '' } = useParams();
  const navigate = useNavigate();
  const programs = useAppStore((state) => state.programs);
  const sessions = useAppStore((state) => state.sessions);
  const scheduleRules = useAppStore((state) => state.scheduleRules);
  const duplicateProgram = useAppStore((state) => state.duplicateProgram);
  const deleteProgram = useAppStore((state) => state.deleteProgram);
  const startWorkoutFromDay = useAppStore((state) => state.startWorkoutFromDay);
  const activeSession = useAppStore((state) => getActiveSession(state));

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [schedule, setSchedule] = useState<{ dayId: string } | null>(null);

  const program = programs.find((item) => item.id === programId);
  const rules = scheduleRules.filter((rule) => rule.programId === programId && rule.active);
  const programSessions = sessions.filter((session) => session.programId === programId && session.status === 'completed');
  const lastSession = programSessions.sort(
    (a, b) => new Date(b.completedAt ?? b.startedAt).getTime() - new Date(a.completedAt ?? a.startedAt).getTime(),
  )[0];

  if (!program) {
    return (
      <div className="page-enter">
        <PageHeader title="Programme not found" back="/workouts" />
        <EmptyState
          icon={<Dumbbell />}
          title="This programme is no longer here"
          text="It may have been deleted. Your logged workouts are safe in history."
          action={
            <Link to="/workouts" className="btn btn-primary">
              Back to workouts
            </Link>
          }
        />
      </div>
    );
  }

  const startDay = (dayId: string) => {
    if (activeSession) {
      navigate(`/session/${activeSession.id}`);
      return;
    }
    const id = startWorkoutFromDay(program.id, dayId);
    if (id) navigate(`/session/${id}`);
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={`${program.level} · ${program.days.length} days / week`}
        title={program.name}
        subtitle={program.description}
        back="/workouts"
        actions={
          <>
            <button type="button" className="icon-btn icon-btn-bordered" onClick={() => setMenuOpen(true)} aria-label="Programme actions">
              <MoreHorizontal />
            </button>
            <Link to={`/programs/${program.id}/edit`} className="btn btn-secondary btn-sm">
              <Pencil /> Edit
            </Link>
          </>
        }
      />

      <div className="tag-row" style={{ marginTop: -6, marginBottom: 18 }}>
        {program.isExample && <span className="badge badge-lime">Example programme</span>}
        <span className="badge">{program.goal}</span>
        <span className="badge">{programSetCount(program)} total sets</span>
        {rules.length > 0 && <span className="badge badge-mint">{rules.length} repeating</span>}
      </div>

      <div className="program-meta-grid">
        <div className="card card-sm">
          <Clock size={17} className="muted" />
          <span className="stat-value" style={{ fontSize: '1.2rem', marginTop: 6 }}>
            {Math.round(program.days.reduce((sum, day) => sum + estimateProgramDayMinutes(day), 0) / Math.max(1, program.days.length))}
            <small>min</small>
          </span>
          <span className="tiny muted">Avg. session</span>
        </div>
        <div className="card card-sm">
          <Layers size={17} className="muted" />
          <span className="stat-value" style={{ fontSize: '1.2rem', marginTop: 6 }}>
            {program.days.length}
            <small>days</small>
          </span>
          <span className="tiny muted">Weekly split</span>
        </div>
        <div className="card card-sm">
          <Users size={17} className="muted" />
          <span className="stat-value" style={{ fontSize: '1.2rem', marginTop: 6 }}>
            {programSessions.length}
            <small>logged</small>
          </span>
          <span className="tiny muted">From this plan</span>
        </div>
        <div className="card card-sm">
          <CalendarDays size={17} className="muted" />
          <span className="stat-value" style={{ fontSize: '1.2rem', marginTop: 6 }}>
            {rules.length}
            <small>rules</small>
          </span>
          <span className="tiny muted">Repeating</span>
        </div>
      </div>

      {lastSession && (
        <div className="card card-sm last-session-card">
          <span className="entity-icon entity-icon-lime">
            <Dumbbell />
          </span>
          <div className="grow">
            <p className="strong small">Last trained: {lastSession.name}</p>
            <p className="tiny muted">
              {new Date(lastSession.completedAt ?? lastSession.startedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              · {lastSession.exercises.length} exercises
            </p>
          </div>
          <Link to={`/history/${lastSession.id}`} className="btn btn-xs btn-secondary">
            Review
          </Link>
        </div>
      )}

      <div className="section">
        <div className="section-head">
          <h2 className="section-title">Training days</h2>
          <Link to="/calendar" className="section-link">
            Open calendar <ChevronRight />
          </Link>
        </div>
        <div className="stack">
          {program.days.map((day, index) => (
            <article className="day-card" key={day.id}>
              <div className="day-card-head">
                <span className="day-number">{String(index + 1).padStart(2, '0')}</span>
                <div className="grow">
                  <h3 className="day-card-title">{day.name}</h3>
                  <p className="day-card-sub">
                    {day.focus} · {day.exercises.length} exercises · {estimateProgramDayMinutes(day)} min
                  </p>
                </div>
                <div className="day-card-actions">
                  <button
                    type="button"
                    className="icon-btn icon-btn-sm"
                    onClick={() => setSchedule({ dayId: day.id })}
                    aria-label={`Schedule ${day.name}`}
                    title="Schedule"
                  >
                    <CalendarDays />
                  </button>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => startDay(day.id)}>
                    <Play /> Start
                  </button>
                </div>
              </div>

              <div className="day-exercise-list">
                {day.exercises.length === 0 ? (
                  <p className="tiny muted" style={{ padding: '10px 0' }}>
                    No exercises yet.{' '}
                    <Link to={`/programs/${program.id}/edit`} className="lime">
                      Add some
                    </Link>
                  </p>
                ) : (
                  day.exercises.map((exercise, exerciseIndex) => {
                    const info = getExercise(exercise.exerciseId);
                    return (
                      <Link to={`/library/${exercise.exerciseId}`} key={exercise.id} className="day-exercise-row">
                        <span className="day-exercise-index">{exerciseIndex + 1}</span>
                        <span className="grow">
                          <span className="day-exercise-name">{info?.name ?? 'Unknown exercise'}</span>
                          <span className="day-exercise-meta">
                            {info?.primary.map((muscle) => MUSCLE_LABELS[muscle]).join(' · ')}
                            {exercise.note ? ` · ${exercise.note}` : ''}
                          </span>
                        </span>
                        <span className="day-exercise-target">
                          {exercise.sets} × {formatTargetReps(exercise.repsMin, exercise.repsMax)}
                          <small>· {exercise.restSec}s rest</small>
                        </span>
                        <ChevronRight width={15} className="muted" />
                      </Link>
                    );
                  })
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {rules.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Repeating schedule</h2>
          </div>
          <div className="stack-sm">
            {rules.map((rule) => {
              const day = program.days.find((item) => item.id === rule.programDayId);
              return (
                <div className="card card-sm schedule-rule-row" key={rule.id}>
                  <span className="entity-icon entity-icon-violet">
                    <Repeat />
                  </span>
                  <div className="grow">
                    <p className="strong small">{day?.name ?? 'Training day'}</p>
                    <p className="tiny muted">
                      {recurrenceLabel(rule)} · from {rule.startDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-xs btn-secondary"
                    onClick={() => setSchedule({ dayId: rule.programDayId })}
                  >
                    Change
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="info-note mt-4">
        <CalendarDays />
        <span>
          You can drag any training day from the calendar palette onto a date, then choose to repeat it weekly, every two
          weeks or daily.
        </span>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={program.name} subtitle="Programme actions">
        <div className="sheet-action-list">
          <Link to={`/programs/${program.id}/edit`} className="sheet-action" onClick={() => setMenuOpen(false)}>
            <Pencil /> Edit days and exercises
          </Link>
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              const id = duplicateProgram(program.id);
              setMenuOpen(false);
              if (id) {
                toast('Programme duplicated.', 'success');
                navigate(`/programs/${id}`);
              }
            }}
          >
            <Copy /> Duplicate programme
          </button>
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              setMenuOpen(false);
              setSchedule({ dayId: program.days[0]?.id ?? '' });
            }}
          >
            <CalendarDays /> Schedule first day
          </button>
          <button
            type="button"
            className="sheet-action sheet-action-danger"
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          >
            <Trash2 /> Delete programme
          </button>
        </div>
      </Sheet>

      <ConfirmSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this programme?"
        message="Its repeating calendar entries will be removed. Workouts you already logged stay in history."
        confirmLabel="Delete programme"
        danger
        onConfirm={() => {
          deleteProgram(program.id);
          toast('Programme deleted.', 'success');
          navigate('/workouts');
        }}
      />

      <ScheduleSheet
        open={Boolean(schedule?.dayId)}
        onClose={() => setSchedule(null)}
        programId={program.id}
        programDayId={schedule?.dayId ?? null}
        date={todayKey()}
      />
    </div>
  );
}
