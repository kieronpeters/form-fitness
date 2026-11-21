import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Copy,
  Dumbbell,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAppStore, getActiveSession } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { EmptyState } from '../components/ui/EmptyState';
import { programEstimatedMinutes, programSetCount } from '../lib/program';
import { estimateProgramDayMinutes, sessionDurationMinutes, sessionVolumeKg } from '../lib/workout';
import { formatDuration, formatVolume } from '../lib/units';
import { relTime } from '../lib/date';
import { toast } from '../store/toastStore';

export function WorkoutsPage() {
  const navigate = useNavigate();
  const programs = useAppStore((state) => state.programs);
  const sessions = useAppStore((state) => state.sessions);
  const profile = useAppStore((state) => state.profile);
  const scheduleRules = useAppStore((state) => state.scheduleRules);
  const activeSession = useAppStore((state) => getActiveSession(state));
  const startWorkoutFromDay = useAppStore((state) => state.startWorkoutFromDay);
  const startEmptyWorkout = useAppStore((state) => state.startEmptyWorkout);
  const createProgram = useAppStore((state) => state.createProgram);
  const deleteProgram = useAppStore((state) => state.deleteProgram);
  const duplicateProgram = useAppStore((state) => state.duplicateProgram);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [menuProgramId, setMenuProgramId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  const recent = sessions
    .filter((session) => session.status === 'completed')
    .sort((a, b) => new Date(b.completedAt ?? b.startedAt).getTime() - new Date(a.completedAt ?? a.startedAt).getTime())
    .slice(0, 3);

  const menuProgram = programs.find((program) => program.id === menuProgramId) ?? null;
  const deleteProgramObj = programs.find((program) => program.id === deleteTarget) ?? null;

  const activePrograms = useMemo(
    () => programs.filter((program) => scheduleRules.some((rule) => rule.programId === program.id && rule.active)),
    [programs, scheduleRules],
  );

  const handleQuickStart = (programId: string, dayId: string) => {
    if (activeSession) {
      navigate(`/session/${activeSession.id}`);
      return;
    }
    const id = startWorkoutFromDay(programId, dayId);
    if (id) navigate(`/session/${id}`);
  };

  const handleCreate = () => {
    const name = newName.trim() || 'My programme';
    const id = createProgram(name);
    setCreateOpen(false);
    setNewName('');
    toast('Programme created — add your days and lifts.', 'success');
    navigate(`/programs/${id}/edit`);
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Train"
        title="Workouts"
        subtitle="Build programmes, start a session, or log something on the fly."
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm hide-xs" onClick={() => setDayPickerOpen(true)}>
              <Sparkles /> Quick start
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
              <Plus /> New
            </button>
          </>
        }
      />

      {activeSession && (
        <Link to={`/session/${activeSession.id}`} className="active-banner">
          <span className="active-banner-icon">
            <Activity />
          </span>
          <span className="grow">
            <span className="eyebrow" style={{ color: 'currentColor', opacity: 0.6 }}>
              Workout in progress
            </span>
            <span className="active-banner-title">{activeSession.name}</span>
            <span className="tiny" style={{ display: 'block', opacity: 0.7 }}>
              {activeSession.exercises.length} exercises · tap to resume
            </span>
          </span>
          <span className="btn btn-sm btn-primary">Resume</span>
        </Link>
      )}

      <div className="train-top-actions">
        <button type="button" className="train-action-card" onClick={() => setDayPickerOpen(true)}>
          <span className="entity-icon entity-icon-lime">
            <Dumbbell />
          </span>
          <span>
            <span className="strong small">Quick start</span>
            <span className="tiny muted">Start a programme day</span>
          </span>
        </button>
        <button
          type="button"
          className="train-action-card"
          onClick={() => {
            const id = startEmptyWorkout();
            if (id) navigate(`/session/${id}`);
          }}
        >
          <span className="entity-icon entity-icon-coral">
            <Plus />
          </span>
          <span>
            <span className="strong small">Empty workout</span>
            <span className="tiny muted">Log as you go</span>
          </span>
        </button>
        <Link to="/library" className="train-action-card">
          <span className="entity-icon entity-icon-blue">
            <Search />
          </span>
          <span>
            <span className="strong small">Exercise library</span>
            <span className="tiny muted">Find, learn, swap</span>
          </span>
        </Link>
        <Link to="/calendar" className="train-action-card">
          <span className="entity-icon entity-icon-violet">
            <CalendarDays />
          </span>
          <span>
            <span className="strong small">Plan week</span>
            <span className="tiny muted">Schedule and repeat</span>
          </span>
        </Link>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Your programmes</h2>
          {activePrograms.length > 0 && <span className="badge badge-lime">{activePrograms.length} scheduled</span>}
        </div>
        {programs.length === 0 ? (
          <EmptyState
            icon={<Dumbbell />}
            title="No programmes yet"
            text="Create a programme, add training days, then schedule them on your calendar."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
                <Plus /> Create a programme
              </button>
            }
          />
        ) : (
          <div className="program-grid">
            {programs.map((program) => (
              <article className="card program-card" key={program.id}>
                <div className="between" style={{ alignItems: 'flex-start' }}>
                  <Link to={`/programs/${program.id}`} className="grow">
                    <div className="tag-row" style={{ marginBottom: 9 }}>
                      {program.isExample && <span className="badge badge-lime">Example</span>}
                      <span className="badge">{program.level}</span>
                      <span className="badge">{program.days.length} days</span>
                    </div>
                    <h3 className="program-card-title">{program.name}</h3>
                    <p className="program-card-desc clamp-2">{program.description}</p>
                  </Link>
                  <button
                    type="button"
                    className="icon-btn icon-btn-sm"
                    onClick={() => setMenuProgramId(program.id)}
                    aria-label={`Actions for ${program.name}`}
                  >
                    <MoreHorizontal />
                  </button>
                </div>

                <div className="program-card-stats">
                  <span>
                    <b>{programSetCount(program)}</b> sets
                  </span>
                  <span>
                    <b>{Math.round(programEstimatedMinutes(program) / Math.max(1, program.days.length))}</b> min / day
                  </span>
                  <span>
                    <b>{program.days.reduce((sum, day) => sum + day.exercises.length, 0)}</b> exercises
                  </span>
                </div>

                <div className="program-day-strip">
                  {program.days.slice(0, 5).map((day) => (
                    <button
                      type="button"
                      key={day.id}
                      className="program-day-pill"
                      onClick={() => handleQuickStart(program.id, day.id)}
                      title={`Start ${day.name}`}
                    >
                      <span>{day.name.replace(/^Day \d+ — /, '')}</span>
                      <small>{estimateProgramDayMinutes(day)}m</small>
                    </button>
                  ))}
                </div>

                <div className="program-card-footer">
                  <Link to={`/programs/${program.id}`} className="btn btn-sm btn-secondary">
                    View programme <ArrowRight size={14} />
                  </Link>
                  <Link to={`/programs/${program.id}/edit`} className="btn btn-sm btn-ghost">
                    <Pencil size={14} /> Edit
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="train-columns">
        <section className="section" style={{ marginTop: 0 }}>
          <div className="section-head">
            <h2 className="section-title">Recently logged</h2>
            <Link to="/history" className="section-link">
              All history <ChevronRight />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="card empty-inline">
              <span className="entity-icon">
                <Dumbbell />
              </span>
              <div className="grow">
                <p className="strong small">Nothing logged yet</p>
                <p className="tiny muted">Your training history will show up here.</p>
              </div>
            </div>
          ) : (
            <div className="list">
              {recent.map((session) => (
                <Link to={`/history/${session.id}`} className="list-item" key={session.id}>
                  <span className="entity-icon">
                    <Dumbbell />
                  </span>
                  <span className="list-main">
                    <span className="list-title">{session.name}</span>
                    <span className="list-sub">
                      {relTime(session.completedAt ?? session.startedAt)} · {formatVolume(sessionVolumeKg(session), profile.unitSystem)} ·{' '}
                      {formatDuration(sessionDurationMinutes(session) * 60)}
                    </span>
                  </span>
                  <span className="list-chevron">
                    <ChevronRight />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section" style={{ marginTop: 0 }}>
          <div className="section-head">
            <h2 className="section-title">Build & learn</h2>
          </div>
          <div className="stack-sm">
            <Link to="/library" className="card card-sm card-interactive mini-link-card">
              <span className="entity-icon entity-icon-blue">
                <Search />
              </span>
              <span className="grow">
                <span className="strong small">Exercise library</span>
                <span className="tiny muted">Technique cues, muscles, equipment and alternatives.</span>
              </span>
              <ChevronRight width={16} />
            </Link>
            <Link to="/learn/split-that-survives-real-life" className="card card-sm card-interactive mini-link-card">
              <span className="entity-icon entity-icon-gold">
                <Sparkles />
              </span>
              <span className="grow">
                <span className="strong small">Build a split that fits your week</span>
                <span className="tiny muted">A practical guide to choosing training days.</span>
              </span>
              <ChevronRight width={16} />
            </Link>
            <Link to="/calendar" className="card card-sm card-interactive mini-link-card">
              <span className="entity-icon entity-icon-violet">
                <CalendarDays />
              </span>
              <span className="grow">
                <span className="strong small">Repeat your training week</span>
                <span className="tiny muted">Drag a programme day onto a date, then repeat it.</span>
              </span>
              <ChevronRight width={16} />
            </Link>
          </div>
        </section>
      </div>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a programme"
        subtitle="Name it, then add days and exercises."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary grow" onClick={handleCreate}>
              Create & edit
            </button>
          </>
        }
      >
        <div className="field">
          <label className="field-label" htmlFor="program-name">
            Programme name
          </label>
          <input
            id="program-name"
            className="input"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="e.g. Off-season strength"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleCreate();
            }}
          />
          <p className="field-hint">You can rename it later. Nothing is locked in.</p>
        </div>
        <div className="info-note mt-3">
          <Sparkles />
          <span>Not sure where to start? Duplicate the example 5-day programme and adjust it.</span>
        </div>
      </Sheet>

      <Sheet
        open={Boolean(menuProgram)}
        onClose={() => setMenuProgramId(null)}
        title={menuProgram?.name}
        subtitle={`${menuProgram?.days.length ?? 0} training days`}
      >
        <div className="sheet-action-list">
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              if (!menuProgram) return;
              setMenuProgramId(null);
              navigate(`/programs/${menuProgram.id}/edit`);
            }}
          >
            <Pencil /> Edit programme
          </button>
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              if (!menuProgram) return;
              const id = duplicateProgram(menuProgram.id);
              setMenuProgramId(null);
              if (id) {
                toast('Programme duplicated.', 'success');
                navigate(`/programs/${id}`);
              }
            }}
          >
            <Copy /> Duplicate
          </button>
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              if (!menuProgram) return;
              navigate(`/programs/${menuProgram.id}`);
            }}
          >
            <CalendarDays /> View & schedule
          </button>
          <button
            type="button"
            className="sheet-action sheet-action-danger"
            onClick={() => {
              setDeleteTarget(menuProgramId);
              setMenuProgramId(null);
            }}
          >
            <Trash2 /> Delete programme
          </button>
        </div>
      </Sheet>

      <Sheet
        open={dayPickerOpen}
        onClose={() => setDayPickerOpen(false)}
        title="Quick start"
        subtitle="Pick a programme day to start logging."
      >
        {programs.length === 0 ? (
          <EmptyState
            icon={<Dumbbell />}
            title="No programme days yet"
            text="Create a programme first, or start an empty workout from the button above."
          />
        ) : (
          <div className="stack">
            {programs.map((program) => (
              <div key={program.id}>
                <p className="eyebrow" style={{ marginBottom: 7 }}>
                  {program.name}
                </p>
                <div className="stack-sm">
                  {program.days.map((day) => (
                    <button
                      type="button"
                      key={day.id}
                      className="day-pick-row"
                      onClick={() => {
                        setDayPickerOpen(false);
                        handleQuickStart(program.id, day.id);
                      }}
                    >
                      <span className="entity-icon entity-icon-lime">
                        <Dumbbell />
                      </span>
                      <span className="grow">
                        <span className="strong small">{day.name}</span>
                        <span className="tiny muted">
                          {day.focus} · {day.exercises.length} exercises · {estimateProgramDayMinutes(day)} min
                        </span>
                      </span>
                      <span className="btn btn-xs btn-primary">
                        Start <ArrowRight size={13} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Sheet>

      <ConfirmSheet
        open={Boolean(deleteProgramObj)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this programme?"
        message={`“${deleteProgramObj?.name ?? ''}” and its repeating calendar entries will be removed. Workouts you already logged stay in your history.`}
        confirmLabel="Delete programme"
        danger
        onConfirm={() => {
          if (deleteTarget) {
            deleteProgram(deleteTarget);
            toast('Programme deleted.', 'success');
          }
        }}
      />
    </div>
  );
}
