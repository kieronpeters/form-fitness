import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCheck,
  Dumbbell,
  Flag,
  Info,
  Plus,
  Timer,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useNow } from '../hooks/useNow';
import { SessionExerciseCard } from '../components/workout/SessionExerciseCard';
import { SessionPhotoStrip } from '../components/workout/SessionPhotoStrip';
import { ExercisePicker } from '../components/ExercisePicker';
import { Sheet } from '../components/ui/Sheet';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { EmptyState } from '../components/ui/EmptyState';
import { ProgressRing } from '../components/ui/ProgressRing';
import { formatUnits, formatVolume, formatWeight, formatWeightValue, displayToKg, weightUnit, formatTimer } from '../lib/units';
import { sessionVolumeKg } from '../lib/workout';
import { toDisplayDate } from '../lib/date';
import { toast } from '../store/toastStore';

export function ActiveSessionPage() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const session = useAppStore((state) => state.sessions.find((item) => item.id === sessionId));
  const allSessions = useAppStore((state) => state.sessions);
  const profile = useAppStore((state) => state.profile);
  const addExerciseToSession = useAppStore((state) => state.addExerciseToSession);
  const finishWorkout = useAppStore((state) => state.finishWorkout);
  const discardWorkout = useAppStore((state) => state.discardWorkout);
  const renameSession = useAppStore((state) => state.renameSession);
  const setSessionNotes = useAppStore((state) => state.setSessionNotes);
  const setSessionBodyweight = useAppStore((state) => state.setSessionBodyweight);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [finishedLocally, setFinishedLocally] = useState(false);
  const [nameDraft, setNameDraft] = useState(session?.name ?? '');
  const [bodyweightDraft, setBodyweightDraft] = useState(
    session?.bodyweightKg != null ? formatWeightValue(session.bodyweightKg, profile.unitSystem, 1) : '',
  );

  const now = useNow(1000, Boolean(session));
  const stats = useMemo(() => {
    if (!session) return { completed: 0, planned: 0, exercisesDone: 0 };
    const completed = session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
    const planned = session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const exercisesDone = session.exercises.filter((exercise) => exercise.sets.some((set) => set.completed)).length;
    return { completed, planned, exercisesDone };
  }, [session]);

  if (!session) {
    return (
      <div className="page-enter">
        <EmptyState
          icon={<Dumbbell />}
          title="That workout isn’t here"
          text="It may have been finished or discarded already."
          action={
            <button type="button" className="btn btn-primary" onClick={() => navigate('/workouts')}>
              Back to workouts
            </button>
          }
        />
      </div>
    );
  }

  if (session.status !== 'active') {
    return <Navigate to={`/history/${session.id}${finishedLocally ? '?finished=1' : ''}`} replace />;
  }

  const elapsedSeconds = Math.max(0, Math.round((now - new Date(session.startedAt).getTime()) / 1000));
  const volume = sessionVolumeKg(session);
  const completedSessions = stats.completed;
  const progress = stats.planned > 0 ? stats.completed / stats.planned : 0;

  const handleFinishClick = () => {
    if (stats.completed === 0) {
      toast('Complete at least one set before finishing.', 'error');
      return;
    }
    setFinishOpen(true);
  };

  const confirmFinish = () => {
    setFinishedLocally(true);
    const finished = finishWorkout(session.id);
    if (finished) {
      toast('Workout complete. Nice work.', 'success');
      navigate(`/history/${finished.id}?finished=1`, { replace: true });
    }
  };

  const openDetails = () => {
    setNameDraft(session.name);
    setBodyweightDraft(session.bodyweightKg != null ? formatWeightValue(session.bodyweightKg, profile.unitSystem, 1) : '');
    setDetailsOpen(true);
  };

  return (
    <div className="page-enter session-page">
      <header className="session-top">
        <button type="button" className="icon-btn icon-btn-bordered" onClick={() => setDiscardOpen(true)} aria-label="Close workout">
          <X />
        </button>
        <div className="session-top-center">
          <p className="eyebrow">
            {toDisplayDate(session.startedAt)} · {formatTimer(elapsedSeconds)}
          </p>
          <h1 className="session-title">{session.name}</h1>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleFinishClick}>
          Finish
        </button>
      </header>

      {session.scheduledDate && (
        <p className="session-scheduled-note">
          <CalendarDays size={13} /> Scheduled for {toDisplayDate(session.scheduledDate)}
        </p>
      )}

      <section className="card session-overview">
        <ProgressRing
          value={progress}
          size={84}
          stroke={7}
          number={`${Math.round(progress * 100)}%`}
          label="sets done"
          ariaLabel={`${stats.completed} of ${stats.planned} sets complete`}
        />
        <div className="session-overview-stats">
          <div>
            <p className="stat-value">
              {stats.completed}
              <small>/{stats.planned}</small>
            </p>
            <p className="stat-label">Sets</p>
          </div>
          <div>
            <p className="stat-value">
              {formatVolume(volume, profile.unitSystem).replace(` ${weightUnit(profile.unitSystem)}`, '')}
              <small>{weightUnit(profile.unitSystem)}</small>
            </p>
            <p className="stat-label">Volume</p>
          </div>
          <div>
            <p className="stat-value">
              {session.exercises.length}
              <small>lifts</small>
            </p>
            <p className="stat-label">Exercises</p>
          </div>
        </div>
        <button type="button" className="icon-btn icon-btn-sm" onClick={openDetails} aria-label="Session details">
          <Info />
        </button>
      </section>

      <SessionPhotoStrip session={session} />

      <div className="session-exercises">
        {session.exercises.length === 0 ? (
          <EmptyState
            icon={<Dumbbell />}
            title="Let’s add the first exercise"
            text="Pick a lift from the library and start logging sets. Weight and reps carry over from your last session."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setPickerOpen(true)}>
                <Plus /> Add exercise
              </button>
            }
          />
        ) : (
          session.exercises.map((sessionExercise) => (
            <SessionExerciseCard
              key={sessionExercise.id}
              session={session}
              sessionExercise={sessionExercise}
              allSessions={allSessions}
            />
          ))
        )}
      </div>

      <button type="button" className="btn btn-secondary btn-block session-add-exercise" onClick={() => setPickerOpen(true)}>
        <Plus /> Add exercise
      </button>

      <section className="card session-notes-card">
        <label className="field-label" htmlFor="session-notes">
          Session notes
        </label>
        <textarea
          id="session-notes"
          className="textarea"
          rows={3}
          value={session.notes ?? ''}
          placeholder="How did the session feel? Anything to remember for next time?"
          onChange={(event) => setSessionNotes(session.id, event.target.value)}
        />
      </section>

      <div className="session-foot">
        <div className="session-foot-info">
          <span>
            <CheckCheck size={15} /> {completedSessions} sets
          </span>
          <span>
            <Timer size={15} /> {formatTimer(elapsedSeconds)}
          </span>
          <span>
            <Flag size={15} /> {stats.exercisesDone}/{session.exercises.length} exercises
          </span>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleFinishClick}>
          Finish & save
        </button>
      </div>

      <Sheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Session details"
        subtitle="Name it, add your bodyweight, or jot something down."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDetailsOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary grow"
              onClick={() => {
                if (nameDraft.trim()) renameSession(session.id, nameDraft.trim());
                const parsed = Number(bodyweightDraft.replace(',', '.'));
                setSessionBodyweight(
                  session.id,
                  Number.isFinite(parsed) && parsed > 0 ? Math.round(displayToKg(parsed, profile.unitSystem) * 10) / 10 : undefined,
                );
                setDetailsOpen(false);
                toast('Session details saved.', 'success');
              }}
            >
              Save details
            </button>
          </>
        }
      >
        <div className="field">
          <label className="field-label" htmlFor="session-name">
            Session name
          </label>
          <input
            id="session-name"
            className="input"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder="Push day"
          />
        </div>
        <div className="field mt-3">
          <label className="field-label" htmlFor="session-bodyweight">
            Bodyweight <span className="muted">(optional)</span>
          </label>
          <div className="input-group">
            <input
              id="session-bodyweight"
              className="input"
              inputMode="decimal"
              value={bodyweightDraft}
              onChange={(event) => setBodyweightDraft(event.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="e.g. 78"
            />
            <span className="input-suffix">{formatUnits(profile.unitSystem)}</span>
          </div>
          <p className="field-hint">Saved with this session, separate from your diary.</p>
        </div>
        <div className="field mt-3">
          <label className="field-label" htmlFor="session-notes-detail">
            Notes
          </label>
          <textarea
            id="session-notes-detail"
            className="textarea"
            value={session.notes ?? ''}
            onChange={(event) => setSessionNotes(session.id, event.target.value)}
            placeholder="Sleep, energy, cues that worked…"
          />
        </div>
      </Sheet>

      <Sheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="Finish this workout?"
        subtitle="Everything you checked off will be saved to your history."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setFinishOpen(false)}>
              Keep training
            </button>
            <button type="button" className="btn btn-primary grow" onClick={confirmFinish}>
              Finish & save
            </button>
          </>
        }
      >
        <div className="finish-summary">
          <div>
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">sets completed</span>
          </div>
          <div>
            <span className="stat-value">{formatVolume(volume, profile.unitSystem)}</span>
            <span className="stat-label">volume moved</span>
          </div>
          <div>
            <span className="stat-value">{formatTimer(elapsedSeconds)}</span>
            <span className="stat-label">time under the bar</span>
          </div>
        </div>
        <div className="info-note mt-3">
          <CheckCheck />
          <span>
            {session.scheduledDate
              ? 'This matches a scheduled session, so your calendar will mark it complete.'
              : 'Your session will appear in history and count toward this week’s targets.'}{' '}
            Progress photos are saved with it.
          </span>
        </div>
        {stats.completed < session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0) && (
          <p className="tiny muted mt-2">Unchecked sets won’t be included in your history.</p>
        )}
      </Sheet>

      <ConfirmSheet
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard this workout?"
        message="This active session and any photos attached to it will be removed. Nothing will be added to your history."
        confirmLabel="Discard workout"
        danger
        onConfirm={() => {
          discardWorkout(session.id);
          toast('Workout discarded.', 'success');
          navigate('/workouts');
        }}
      />

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Add exercise"
        subtitle="Search by name, muscle or equipment."
        onSelect={(exercise) => addExerciseToSession(session.id, exercise.id)}
      />

      <span className="sr-only" aria-live="polite">
        {formatWeight(volume, profile.unitSystem)} lifted so far; {stats.completed} of {stats.planned} sets complete.
      </span>
    </div>
  );
}
