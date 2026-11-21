import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  Camera,
  CheckCheck,
  ChevronRight,
  Dumbbell,
  Repeat,
  Star,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { SessionPhotoStrip } from '../components/workout/SessionPhotoStrip';
import { getExercise } from '../data/exercises';
import { newPRsInSession, sessionDurationMinutes, sessionReps, sessionVolumeKg, sessionWorkingSets } from '../lib/workout';
import { formatDuration, formatVolume, formatWeight } from '../lib/units';
import { toLongDate } from '../lib/date';
import { toast } from '../store/toastStore';

export function SessionDetailPage() {
  const { sessionId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = useAppStore((state) => state.sessions.find((item) => item.id === sessionId));
  const sessions = useAppStore((state) => state.sessions);
  const programs = useAppStore((state) => state.programs);
  const profile = useAppStore((state) => state.profile);
  const customExercises = useAppStore((state) => state.customExercises);
  const repeatWorkout = useAppStore((state) => state.repeatWorkout);
  const deleteSession = useAppStore((state) => state.deleteSession);
  const removeSessionPhoto = useAppStore((state) => state.removeSessionPhoto);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const justFinished = searchParams.get('finished') === '1';

  const prs = useMemo(() => (session ? newPRsInSession(session, sessions) : []), [session, sessions]);

  if (!session) {
    return (
      <div className="page-enter">
        <PageHeader title="Workout not found" back="/history" />
        <EmptyState
          icon={<Dumbbell />}
          title="This workout isn’t available"
          text="It may have been deleted."
          action={
            <Link to="/history" className="btn btn-primary">
              Back to history
            </Link>
          }
        />
      </div>
    );
  }

  if (session.status === 'active') {
    return <Navigate to={`/session/${session.id}`} replace />;
  }

  const program = programs.find((item) => item.id === session.programId);
  const photos = session.photoIds.length;

  const handleRepeat = () => {
    const id = repeatWorkout(session.id);
    if (id) {
      toast('Workout restarted from this session.', 'success');
      navigate(`/session/${id}`);
    }
  };

  return (
    <div className="page-enter">
      {justFinished && (
        <section className="finish-hero">
          <span className="finish-hero-icon">
            <Trophy />
          </span>
          <p className="eyebrow">Session complete</p>
          <h1>Work logged. Future you says thanks.</h1>
          <p className="small" style={{ opacity: 0.75 }}>
            {formatVolume(sessionVolumeKg(session), profile.unitSystem)} moved across {sessionWorkingSets(session)} working sets.
          </p>
          <div className="finish-hero-actions">
            <Link to="/" className="btn btn-sm btn-primary">
              Done
            </Link>
            <button type="button" className="btn btn-sm btn-ghost" onClick={handleRepeat}>
              <Repeat size={14} /> Repeat
            </button>
          </div>
        </section>
      )}

      <PageHeader
        eyebrow={`${toLongDate(session.completedAt ?? session.startedAt)}${session.scheduledDate ? ' · scheduled session' : ''}`}
        title={session.name}
        subtitle={program ? `From ${program.name}` : 'Freestyle session'}
        back="/history"
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleRepeat}>
              <Repeat /> Repeat
            </button>
            <button type="button" className="icon-btn icon-btn-bordered" onClick={() => setDeleteOpen(true)} aria-label="Delete workout">
              <Trash2 />
            </button>
          </>
        }
      />

      {session.isSample && (
        <div className="info-note warn-note" style={{ marginTop: -8, marginBottom: 14 }}>
          <Star />
          <span>This is sample history added from Profile. Remove sample data any time without affecting real workouts.</span>
        </div>
      )}

      <div className="session-detail-stats">
        <div className="card card-sm">
          <span className="stat-value">{formatVolume(sessionVolumeKg(session), profile.unitSystem)}</span>
          <span className="stat-label">
            <TrendingUp /> Volume
          </span>
        </div>
        <div className="card card-sm">
          <span className="stat-value">{sessionWorkingSets(session)}</span>
          <span className="stat-label">
            <CheckCheck /> Working sets
          </span>
        </div>
        <div className="card card-sm">
          <span className="stat-value">{sessionReps(session)}</span>
          <span className="stat-label">
            <Dumbbell /> Reps
          </span>
        </div>
        <div className="card card-sm">
          <span className="stat-value">{formatDuration(sessionDurationMinutes(session) * 60)}</span>
          <span className="stat-label">
            <Timer /> Duration
          </span>
        </div>
      </div>

      {prs.length > 0 && (
        <section className="card pr-celebration">
          <div className="row" style={{ gap: 10 }}>
            <span className="entity-icon entity-icon-gold">
              <Star />
            </span>
            <div className="grow">
              <p className="strong">New best set{prs.length > 1 ? 's' : ''} today</p>
              <p className="tiny muted">
                {prs.every((pr) => pr.previous1RM != null)
                  ? `Estimated 1RM improved on ${prs.length} lift${prs.length > 1 ? 's' : ''}.`
                  : `A benchmark to beat next time on ${prs.length} lift${prs.length > 1 ? 's' : ''}.`}
              </p>
            </div>
            <span className="badge badge-gold">{prs.length} PR</span>
          </div>
          <div className="stack-sm mt-3">
            {prs.map((pr) => (
              <div className="pr-row" key={pr.exerciseId}>
                <span className="grow">
                  <span className="strong small">{getExercise(pr.exerciseId, customExercises)?.name ?? 'Lift'}</span>
                  <span className="tiny muted">
                    {formatWeight(pr.weightKg, profile.unitSystem)} × {pr.reps} reps
                  </span>
                </span>
                <span className="badge badge-gold">
                  {pr.previous1RM == null ? 'First best' : `+${Math.round(pr.estimated1RM - pr.previous1RM)} kg e1RM`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <SessionPhotoStrip session={session} />

      <div className="session-detail-layout">
        <div className="stack">
          <div className="section-head" style={{ marginBottom: 2 }}>
            <h2 className="section-title">Exercises</h2>
            <span className="badge">
              <Camera size={11} /> {photos} photos
            </span>
          </div>
          {session.exercises.map((sessionExercise) => {
            const exercise = getExercise(sessionExercise.exerciseId, customExercises);
            const working = sessionExercise.sets.filter((set) => set.type !== 'warmup');
            const warmups = sessionExercise.sets.filter((set) => set.type === 'warmup');
            return (
              <article className="card card-sm detail-exercise" key={sessionExercise.id}>
                <div className="between" style={{ alignItems: 'flex-start' }}>
                  <div className="grow">
                    <Link to={`/library/${sessionExercise.exerciseId}`} className="strong" style={{ fontSize: '0.94rem' }}>
                      {exercise?.name ?? 'Exercise'}
                    </Link>
                    <p className="tiny muted" style={{ marginTop: 2 }}>
                      {working.length} working sets
                      {warmups.length > 0 ? ` · ${warmups.length} warm-up` : ''}
                      {sessionExercise.note ? ` · ${sessionExercise.note}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} className="muted" />
                </div>
                <div className="set-chip-grid">
                  {sessionExercise.sets.map((set, index) => (
                    <span className="set-chip" key={set.id} data-warmup={set.type === 'warmup'}>
                      <small>{set.type === 'warmup' ? `W${index + 1}` : index + 1}</small>
                      <b>
                        {set.weightKg ? `${formatWeight(set.weightKg, profile.unitSystem)}` : 'BW'} × {set.reps}
                      </b>
                      {set.rpe ? <em>RPE {set.rpe}</em> : null}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}

          {session.notes && (
            <div className="card">
              <p className="eyebrow">Session notes</p>
              <p className="small mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                {session.notes}
              </p>
            </div>
          )}
        </div>

        <aside className="stack">
          <div className="card">
            <p className="eyebrow">Session facts</p>
            <div className="detail-facts">
              <div>
                <span>Started</span>
                <strong>{new Date(session.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</strong>
              </div>
              <div>
                <span>Finished</span>
                <strong>
                  {session.completedAt
                    ? new Date(session.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : '—'}
                </strong>
              </div>
              <div>
                <span>Bodyweight</span>
                <strong>{session.bodyweightKg ? formatWeight(session.bodyweightKg, profile.unitSystem) : '—'}</strong>
              </div>
              <div>
                <span>Calendar</span>
                <strong>{session.scheduledDate ? 'Scheduled' : 'Freestyle'}</strong>
              </div>
            </div>
          </div>

          {program && (
            <Link to={`/programs/${program.id}`} className="card card-sm mini-link-card card-interactive">
              <span className="entity-icon entity-icon-lime">
                <CalendarDays />
              </span>
              <span className="grow">
                <span className="strong small">{program.name}</span>
                <span className="tiny muted">Programme details and schedule</span>
              </span>
              <ChevronRight size={16} className="muted" />
            </Link>
          )}

          <div className="info-note">
            <TrendingUp />
            <span>
              Repeat this session to beat your numbers. Weights and reps are pre-filled from this workout, ready to
              confirm or adjust.
            </span>
          </div>
        </aside>
      </div>

      <ConfirmSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this workout?"
        message="The session, its sets and its progress photos will be removed from this device. This cannot be undone."
        confirmLabel="Delete workout"
        danger
        onConfirm={() => {
          void (async () => {
            await Promise.all(session.photoIds.map((id) => removeSessionPhoto(id)));
            deleteSession(session.id);
            toast('Workout deleted.', 'success');
            navigate('/history');
          })();
        }}
      />
    </div>
  );
}
