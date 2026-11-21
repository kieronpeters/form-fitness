import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  Dumbbell,
  History,
  Plus,
  Repeat,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAppStore, getActiveSession } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Sheet } from '../components/ui/Sheet';
import { LineChart } from '../components/charts/Charts';
import { EQUIPMENT_LABELS, EXERCISES, MUSCLE_COLORS, MUSCLE_LABELS, getExercise } from '../data/exercises';
import { computePRs, estimated1RM, exerciseHistory, lastExercisePerformance } from '../lib/workout';
import { formatWeight } from '../lib/units';
import { toDisplayDate } from '../lib/date';
import { toast } from '../store/toastStore';

export function ExerciseDetailPage() {
  const { exerciseId = '' } = useParams();
  const navigate = useNavigate();
  const customExercises = useAppStore((state) => state.customExercises);
  const sessions = useAppStore((state) => state.sessions);
  const programs = useAppStore((state) => state.programs);
  const profile = useAppStore((state) => state.profile);
  const activeSession = useAppStore((state) => getActiveSession(state));
  const startEmptyWorkout = useAppStore((state) => state.startEmptyWorkout);
  const addExerciseToSession = useAppStore((state) => state.addExerciseToSession);
  const addExerciseToDay = useAppStore((state) => state.addExerciseToDay);

  const [programmeOpen, setProgrammeOpen] = useState(false);

  const exercise = getExercise(exerciseId, customExercises);
  const history = useMemo(() => exerciseHistory(sessions, exerciseId), [sessions, exerciseId]);
  const pr = useMemo(() => computePRs(sessions)[exerciseId], [sessions, exerciseId]);
  const last = useMemo(() => lastExercisePerformance(sessions, exerciseId), [sessions, exerciseId]);
  const alternatives = useMemo(() => {
    if (!exercise) return [];
    const curated = exercise.alternatives.map((id) => getExercise(id, customExercises)).filter(Boolean);
    const flagged = new Set([...curated.map((item) => item?.id), exerciseId]);
    const similar = [...EXERCISES, ...customExercises].filter(
      (item) =>
        !flagged.has(item.id) &&
        (item.pattern === exercise.pattern || item.primary.some((muscle) => exercise.primary.includes(muscle))),
    );
    return [...curated, ...similar].slice(0, 5);
  }, [exercise, customExercises, exerciseId]);

  if (!exercise) {
    return (
      <div className="page-enter">
        <PageHeader title="Exercise not found" back="/library" />
        <EmptyState
          icon={<Dumbbell />}
          title="We couldn’t find that exercise"
          text="It may have been a custom exercise that was removed."
          action={
            <Link to="/library" className="btn btn-primary">
              Browse library
            </Link>
          }
        />
      </div>
    );
  }

  const startWithExercise = () => {
    if (activeSession) {
      addExerciseToSession(activeSession.id, exercise.id);
      navigate(`/session/${activeSession.id}`);
      return;
    }
    const sessionId = startEmptyWorkout(`${exercise.name} session`);
    addExerciseToSession(sessionId, exercise.id);
    navigate(`/session/${sessionId}`);
  };

  const chartPoints = history.slice(-10).map((point) => ({
    label: toDisplayDate(point.date).replace(/,.*/, ''),
    value: Math.round(point.estimated1RM),
  }));

  const recentSessions = [...sessions]
    .filter((session) => session.status === 'completed' && session.exercises.some((item) => item.exerciseId === exercise.id))
    .sort((a, b) => new Date(b.completedAt ?? b.startedAt).getTime() - new Date(a.completedAt ?? a.startedAt).getTime())
    .slice(0, 4);

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={`${EQUIPMENT_LABELS[exercise.equipment]} · ${exercise.mechanic}`}
        title={exercise.name}
        subtitle={exercise.description}
        back="/library"
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={startWithExercise}>
            <Plus /> Log it
          </button>
        }
      />

      <div className="tag-row" style={{ marginBottom: 18 }}>
        {exercise.primary.map((muscle) => (
          <span className="muscle-tag" key={muscle}>
            <span className="muscle-dot" style={{ background: MUSCLE_COLORS[muscle] }} />
            {MUSCLE_LABELS[muscle]}
          </span>
        ))}
        {exercise.secondary.map((muscle) => (
          <span className="muscle-tag" key={muscle}>
            <span className="muscle-dot" style={{ background: MUSCLE_COLORS[muscle], opacity: 0.45 }} />
            {MUSCLE_LABELS[muscle]}
          </span>
        ))}
        <span className="badge">{exercise.pattern.replaceAll('_', ' ')}</span>
      </div>

      <div className="exercise-detail-grid">
        <div className="stack">
          <div className="exercise-stat-row">
            <div className="card card-sm">
              <span className="eyebrow">
                <Target size={12} style={{ display: 'inline', marginRight: 4 }} /> Personal best
              </span>
              <p className="stat-value mt-1">{pr ? formatWeight(pr.weightKg, profile.unitSystem) : '—'}</p>
              <p className="tiny muted">
                {pr ? `${pr.reps} reps · ${Math.round(pr.estimated1RM)} kg est. 1RM` : 'Log a working set to set one'}
              </p>
            </div>
            <div className="card card-sm">
              <span className="eyebrow">
                <TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} /> Last used
              </span>
              <p className="stat-value mt-1">{last ? toDisplayDate(last.date) : '—'}</p>
              <p className="tiny muted">
                {last ? `${last.sets.length} working sets · ${formatWeight(last.sets[0]?.weightKg ?? null, profile.unitSystem)}` : 'No history yet'}
              </p>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-head">
              <div>
                <p className="chart-title">Estimated strength</p>
                <p className="chart-sub">Best set per session · estimated 1RM</p>
              </div>
              <span className="chart-value">{chartPoints.length > 0 ? `${chartPoints[chartPoints.length - 1].value} kg` : '—'}</span>
            </div>
            <LineChart
              points={chartPoints}
              ariaLabel={`${exercise.name} estimated 1RM trend`}
              formatValue={(value) => `${Math.round(value)}`}
              emptyLabel="Log this exercise in a couple of sessions to see the trend."
            />
          </div>

          <div className="card">
            <div className="section-head" style={{ marginBottom: 8 }}>
              <h2 className="section-title" style={{ fontSize: '1rem' }}>
                Technique cues
              </h2>
              <span className="badge badge-lime">
                <Sparkles size={11} /> Coach notes
              </span>
            </div>
            {exercise.cues.length === 0 ? (
              <p className="small muted">No cues for this custom exercise yet. Use your programme notes to add your own.</p>
            ) : (
              <ul className="cue-list">
                {exercise.cues.map((cue) => (
                  <li key={cue}>
                    <CircleCheck />
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="section-head" style={{ marginBottom: 8 }}>
              <h2 className="section-title" style={{ fontSize: '1rem' }}>
                Recent performance
              </h2>
              <Link to="/history" className="section-link">
                History <ChevronRight />
              </Link>
            </div>
            {recentSessions.length === 0 ? (
              <p className="small muted">No logged sessions yet for this exercise.</p>
            ) : (
              <div className="list">
                {recentSessions.map((session) => {
                  const sessionExercise = session.exercises.find((item) => item.exerciseId === exercise.id);
                  const working = sessionExercise?.sets.filter((set) => set.type !== 'warmup') ?? [];
                  const best = working.reduce(
                    (top, set) => (estimated1RM(set.weightKg, set.reps) > estimated1RM(top?.weightKg ?? null, top?.reps ?? null) ? set : top),
                    working[0],
                  );
                  return (
                    <Link to={`/history/${session.id}`} className="list-item" key={session.id}>
                      <span className="entity-icon">
                        <History />
                      </span>
                      <span className="list-main">
                        <span className="list-title">{toDisplayDate(session.completedAt ?? session.startedAt)}</span>
                        <span className="list-sub">
                          {session.name} · {working.length} sets
                        </span>
                      </span>
                      <span className="numeric small strong">{best ? `${best.weightKg} kg × ${best.reps}` : '—'}</span>
                      <ChevronRight size={15} className="muted" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <h3 style={{ fontSize: '0.98rem' }}>Use this exercise</h3>
            <p className="tiny muted mt-1">Start a session now, or add it to a programme for next time.</p>
            <div className="stack-sm mt-3">
              <button type="button" className="btn btn-primary btn-block" onClick={startWithExercise}>
                <Dumbbell /> Start a workout with it
              </button>
              <button type="button" className="btn btn-secondary btn-block" onClick={() => setProgrammeOpen(true)}>
                <Plus /> Add to a programme
              </button>
            </div>
          </div>

          <div className="card">
            <div className="between">
              <h3 style={{ fontSize: '0.98rem' }}>Alternatives</h3>
              <span className="badge">{alternatives.length}</span>
            </div>
            <p className="tiny muted mt-1">Similar pattern or muscle. Useful when equipment is taken.</p>
            <div className="stack-sm mt-3">
              {alternatives.map((alternative) =>
                alternative ? (
                  <Link to={`/library/${alternative.id}`} className="alt-row" key={alternative.id}>
                    <span className="entity-icon entity-icon-blue">
                      <Repeat />
                    </span>
                    <span className="grow">
                      <span className="strong small">{alternative.name}</span>
                      <span className="tiny muted">
                        {EQUIPMENT_LABELS[alternative.equipment]} · {alternative.primary.map((muscle) => MUSCLE_LABELS[muscle]).join(', ')}
                      </span>
                    </span>
                    <ArrowRight size={15} className="muted" />
                  </Link>
                ) : null,
              )}
            </div>
          </div>

          <div className="info-note">
            <Target />
            <span>
              Aim to beat your best set by a rep or a small weight increase. FORM tracks the estimated 1RM so progress is
              visible even when reps change.
            </span>
          </div>
        </aside>
      </div>

      <Sheet
        open={programmeOpen}
        onClose={() => setProgrammeOpen(false)}
        title="Add to a programme"
        subtitle={`Choose a training day for ${exercise.name}.`}
      >
        {programs.length === 0 ? (
          <EmptyState icon={<Dumbbell />} title="No programmes yet" text="Create one from the Workouts page first." />
        ) : (
          <div className="stack">
            {programs.map((program) => (
              <div key={program.id}>
                <p className="eyebrow" style={{ marginBottom: 6 }}>
                  {program.name}
                </p>
                <div className="stack-sm">
                  {program.days.map((day) => (
                    <button
                      type="button"
                      className="day-pick-row"
                      key={day.id}
                      onClick={() => {
                        addExerciseToDay(program.id, day.id, exercise.id);
                        setProgrammeOpen(false);
                        toast(`Added to ${day.name}.`, 'success');
                      }}
                    >
                      <span className="entity-icon entity-icon-lime">
                        <Dumbbell />
                      </span>
                      <span className="grow">
                        <span className="strong small">{day.name}</span>
                        <span className="tiny muted">
                          {day.focus} · {day.exercises.length} exercises
                        </span>
                      </span>
                      <Plus size={16} className="muted" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </div>
  );
}
