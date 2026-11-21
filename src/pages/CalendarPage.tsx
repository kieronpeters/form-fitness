import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addMonths, subMonths } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  GripVertical,
  Plus,
  Repeat,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAppStore, getActiveSession } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Sheet } from '../components/ui/Sheet';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { ScheduleSheet } from '../components/ScheduleSheet';
import { expandSchedule, recurrenceLabel } from '../lib/schedule';
import {
  addDaysKey,
  fromKey,
  monthGrid,
  toLongDate,
  toMonthLabel,
  todayKey,
  weekDays,
} from '../lib/date';
import { estimateProgramDayMinutes, sessionDurationMinutes, sessionVolumeKg } from '../lib/workout';
import { formatDuration, formatVolume } from '../lib/units';
import { toast } from '../store/toastStore';

interface PaletteItem {
  programId: string;
  dayId: string;
  label: string;
}

interface ScheduleTarget {
  programId: string;
  dayId: string;
  date: string;
  ruleId?: string;
}

export function CalendarPage() {
  const navigate = useNavigate();
  const programs = useAppStore((state) => state.programs);
  const sessions = useAppStore((state) => state.sessions);
  const scheduleRules = useAppStore((state) => state.scheduleRules);
  const settings = useAppStore((state) => state.settings);
  const profile = useAppStore((state) => state.profile);
  const startWorkoutFromDay = useAppStore((state) => state.startWorkoutFromDay);
  const toggleScheduleRule = useAppStore((state) => state.toggleScheduleRule);
  const deleteScheduleRule = useAppStore((state) => state.deleteScheduleRule);
  const activeSession = useAppStore((state) => getActiveSession(state));

  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [paletteProgramId, setPaletteProgramId] = useState(programs[0]?.id ?? '');
  const [placement, setPlacement] = useState<PaletteItem | null>(null);
  const [dragging, setDragging] = useState<PaletteItem | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<ScheduleTarget | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [paletteSheetOpen, setPaletteSheetOpen] = useState(false);

  const dates = useMemo(() => monthGrid(viewMonth, settings.firstDayOfWeek), [viewMonth, settings.firstDayOfWeek]);
  const rangeStart = dates[0];
  const rangeEnd = addDaysKey(dates[dates.length - 1], 7);
  const occurrences = useMemo(
    () => expandSchedule(scheduleRules, programs, sessions, { from: rangeStart, to: rangeEnd }),
    [scheduleRules, programs, sessions, rangeStart, rangeEnd],
  );

  const occurrencesByDate = useMemo(() => {
    const map = new Map<string, typeof occurrences>();
    for (const occurrence of occurrences) {
      const list = map.get(occurrence.date) ?? [];
      list.push(occurrence);
      map.set(occurrence.date, list);
    }
    return map;
  }, [occurrences]);

  const completedByDate = useMemo(() => {
    const map = new Map<string, typeof sessions>();
    for (const session of sessions) {
      if (session.status !== 'completed') continue;
      const localDate = new Date(session.completedAt ?? session.startedAt);
      const local = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
      const list = map.get(local) ?? [];
      list.push(session);
      map.set(local, list);
    }
    return map;
  }, [sessions]);

  const selectedOccurrences = occurrencesByDate.get(selectedDate) ?? [];
  const selectedSessions = completedByDate.get(selectedDate) ?? [];
  const totalScheduled = occurrences.filter((item) => item.date.slice(0, 7) === `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}`).length;
  const completedThisMonth = sessions.filter((session) => {
    if (session.status !== 'completed') return false;
    const date = new Date(session.completedAt ?? session.startedAt);
    return date.getFullYear() === viewMonth.getFullYear() && date.getMonth() === viewMonth.getMonth();
  }).length;

  const paletteProgram = programs.find((program) => program.id === paletteProgramId) ?? programs[0];
  const currentWeek = weekDays(todayKey(), settings.firstDayOfWeek);
  const weekOccurrences = useMemo(
    () =>
      expandSchedule(scheduleRules, programs, sessions, {
        from: currentWeek[0],
        to: currentWeek[currentWeek.length - 1],
      }),
    [scheduleRules, programs, sessions, currentWeek],
  );

  const goToDate = (date: string) => {
    setSelectedDate(date);
    setViewMonth(fromKey(date));
  };

  const openSchedule = (programId: string, dayId: string, date: string, ruleId?: string) => {
    setScheduleTarget({ programId, dayId, date, ruleId });
    setSelectedDate(date);
  };

  const handleDateClick = (date: string) => {
    if (placement) {
      openSchedule(placement.programId, placement.dayId, date);
      setPlacement(null);
      return;
    }
    setSelectedDate(date);
  };

  const handleDrop = (event: React.DragEvent, date: string) => {
    event.preventDefault();
    setDragOverDate(null);
    setDragging(null);
    try {
      const raw = event.dataTransfer.getData('application/form-session');
      if (raw) {
        const parsed = JSON.parse(raw) as PaletteItem;
        openSchedule(parsed.programId, parsed.dayId, date);
        return;
      }
    } catch {
      // fall through to the state copy
    }
    if (dragging) openSchedule(dragging.programId, dragging.dayId, date);
  };

  const startOccurrence = (occurrence: (typeof occurrences)[number]) => {
    if (activeSession) {
      navigate(`/session/${activeSession.id}`);
      return;
    }
    const id = startWorkoutFromDay(occurrence.programId, occurrence.programDayId, {
      scheduledDate: occurrence.date,
      scheduledRuleId: occurrence.ruleId,
    });
    if (id) navigate(`/session/${id}`);
  };

  const paletteDayCards = paletteProgram?.days ?? [];

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Plan"
        title="Calendar"
        subtitle="Place a training day on a date, then repeat it weekly or daily. Drag on desktop, or tap a day and then a date."
        actions={
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPaletteSheetOpen(true)}>
            <Plus /> Schedule
          </button>
        }
      />

      <div className="calendar-summary">
        <div className="row-wrap">
          <span className="streak-chip">
            <CalendarDays size={14} /> {totalScheduled} planned this month
          </span>
          <span className="streak-chip">
            <CheckCircle2 size={14} /> {completedThisMonth} completed
          </span>
          <span className="streak-chip">
            <Repeat size={14} /> {scheduleRules.filter((rule) => rule.active).length} repeat rules
          </span>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => goToDate(todayKey())}>
          <RotateCcw size={14} /> Today
        </button>
      </div>

      <div className="calendar-layout">
        <aside className="palette card">
          <div className="between" style={{ marginBottom: 10 }}>
            <div>
              <p className="eyebrow">Programme palette</p>
              <p className="small strong" style={{ marginTop: 2 }}>
                Drag a day onto a date
              </p>
            </div>
            <Sparkles size={16} className="muted" />
          </div>

          {programs.length === 0 ? (
            <p className="small muted">Create a programme to start planning.</p>
          ) : (
            <>
              <select
                className="select select-compact"
                value={paletteProgram?.id ?? ''}
                onChange={(event) => {
                  setPaletteProgramId(event.target.value);
                  setPlacement(null);
                }}
                aria-label="Programme for palette"
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>

              <div className="palette-list">
                {paletteDayCards.map((day) => {
                  const item: PaletteItem = {
                    programId: paletteProgram?.id ?? '',
                    dayId: day.id,
                    label: `${day.name} — ${paletteProgram?.name ?? ''}`,
                  };
                  const isPlacing = placement?.dayId === day.id;
                  return (
                    <div
                      key={day.id}
                      className="palette-day draggable"
                      draggable
                      data-placing={isPlacing}
                      role="button"
                      tabIndex={0}
                      aria-label={`Place ${day.name}${isPlacing ? ' — now choose a date' : ''}`}
                      onClick={() => {
                        setPlacement(isPlacing ? null : item);
                        if (!isPlacing) toast('Now tap a date on the calendar.', 'success');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setPlacement(isPlacing ? null : item);
                        }
                      }}
                      onDragStart={(event) => {
                        setDragging(item);
                        event.dataTransfer.setData('application/form-session', JSON.stringify(item));
                        event.dataTransfer.effectAllowed = 'copy';
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setDragOverDate(null);
                      }}
                    >
                      <GripVertical size={15} className="muted" />
                      <div className="grow">
                        <p className="program-day-title">{day.name}</p>
                        <p className="program-day-meta">
                          {day.focus} · {estimateProgramDayMinutes(day)} min
                        </p>
                      </div>
                      {isPlacing ? <span className="badge badge-lime">Tap date</span> : <ChevronRight size={15} className="muted" />}
                    </div>
                  );
                })}
              </div>

              <p className="tiny muted palette-hint">
                Drag onto the calendar, or tap a day and then tap a date. You’ll choose once, weekly, every two weeks or
                daily.
              </p>
            </>
          )}
        </aside>

        <div className="calendar-main">
          <div className="calendar">
            <div className="calendar-head">
              <button type="button" className="icon-btn icon-btn-sm" onClick={() => setViewMonth(subMonths(viewMonth, 1))} aria-label="Previous month">
                <ChevronLeft />
              </button>
              <div className="calendar-title-wrap">
                <h2 className="calendar-title">{toMonthLabel(viewMonth)}</h2>
                <button type="button" className="tiny muted" onClick={() => goToDate(todayKey())}>
                  Back to today
                </button>
              </div>
              <button type="button" className="icon-btn icon-btn-sm" onClick={() => setViewMonth(addMonths(viewMonth, 1))} aria-label="Next month">
                <ChevronRight />
              </button>
            </div>

            <div className="calendar-weekdays">
              {Array.from({ length: 7 }, (_, index) => (
                <span key={index}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'][(index + settings.firstDayOfWeek) % 7]}
                </span>
              ))}
            </div>

            <div className="calendar-grid" aria-label={toMonthLabel(viewMonth)}>
              {dates.map((date) => {
                const cellDate = fromKey(date);
                const inMonth = cellDate.getMonth() === viewMonth.getMonth();
                const dayOccurrences = occurrencesByDate.get(date) ?? [];
                const daySessions = completedByDate.get(date) ?? [];
                const isToday = date === todayKey();
                return (
                  <button
                    type="button"
                    key={date}
                    data-date={date}
                    className="calendar-cell"
                    data-outside={!inMonth}
                    data-today={isToday}
                    data-selected={date === selectedDate}
                    data-drop={Boolean(dragging || placement)}
                    data-drop-active={dragOverDate === date}
                    aria-label={`${toLongDate(date)}${dayOccurrences.length ? `, ${dayOccurrences.length} planned` : ''}${daySessions.length ? `, ${daySessions.length} completed` : ''}`}
                    onClick={() => handleDateClick(date)}
                    onDragOver={(event) => {
                      if (dragging) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'copy';
                        setDragOverDate(date);
                      }
                    }}
                    onDragLeave={() => setDragOverDate((current) => (current === date ? null : current))}
                    onDrop={(event) => handleDrop(event, date)}
                  >
                    <span>{cellDate.getDate()}</span>
                    <span className="calendar-dots">
                      {dayOccurrences.slice(0, 3).map((occurrence) => (
                        <span className="calendar-dot" key={occurrence.key} data-done={Boolean(occurrence.completedSessionId)} />
                      ))}
                      {dayOccurrences.length === 0 &&
                        daySessions.slice(0, 1).map((session) => <span className="calendar-dot" key={session.id} data-done />)}
                    </span>
                  </button>
                );
              })}
            </div>

            {placement && (
              <div className="calendar-placing-bar">
                <span>
                  <span className="badge badge-lime">Placing</span> {placement.label}
                </span>
                <button type="button" className="btn btn-xs btn-ghost" onClick={() => setPlacement(null)}>
                  <X size={13} /> Cancel
                </button>
              </div>
            )}
          </div>

          <div className="calendar-agenda-layout">
            <section className="agenda">
              <div className="section-head" style={{ marginBottom: 10 }}>
                <div>
                  <p className="eyebrow">{selectedDate === todayKey() ? 'Today' : 'Selected day'}</p>
                  <h2 className="agenda-title">{toLongDate(selectedDate)}</h2>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <button type="button" className="icon-btn icon-btn-sm" onClick={() => goToDate(addDaysKey(selectedDate, -1))} aria-label="Previous day">
                    <ArrowLeft />
                  </button>
                  <button type="button" className="icon-btn icon-btn-sm" onClick={() => goToDate(addDaysKey(selectedDate, 1))} aria-label="Next day">
                    <ArrowRight />
                  </button>
                </div>
              </div>

              {selectedOccurrences.length === 0 && selectedSessions.length === 0 ? (
                <div className="card card-sm agenda-empty">
                  <CalendarDays size={20} className="muted" />
                  <div className="grow">
                    <p className="strong small">Nothing planned</p>
                    <p className="tiny muted">Drag a programme day here or use the Schedule button.</p>
                  </div>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => setPaletteSheetOpen(true)}>
                    Add
                  </button>
                </div>
              ) : (
                <div className="stack-sm">
                  {selectedOccurrences.map((occurrence) => {
                    const isPast = occurrence.date < todayKey();
                    const isTodayDate = occurrence.date === todayKey();
                    const completed = occurrence.completedSessionId
                      ? sessions.find((session) => session.id === occurrence.completedSessionId)
                      : null;
                    return (
                      <div className="agenda-card" key={occurrence.key} data-completed={Boolean(completed)}>
                        <div className="agenda-time">
                          <Clock size={14} />
                          <span>{occurrence.estimatedMinutes}m</span>
                        </div>
                        <div className="grow">
                          <div className="row" style={{ gap: 6 }}>
                            <p className="strong small">{occurrence.dayName}</p>
                            {completed && <span className="badge badge-mint">Done</span>}
                            {!completed && isPast && <span className="badge">Missed</span>}
                            {!completed && isTodayDate && <span className="badge badge-lime">Today</span>}
                          </div>
                          <p className="tiny muted">
                            {occurrence.programName} · {occurrence.focus} · {occurrence.exerciseCount} exercises
                          </p>
                          {completed && (
                            <p className="tiny muted">
                              {formatVolume(sessionVolumeKg(completed), profile.unitSystem)} · {formatDuration(sessionDurationMinutes(completed) * 60)}
                            </p>
                          )}
                        </div>
                        {completed ? (
                          <Link to={`/history/${completed.id}`} className="btn btn-xs btn-secondary">
                            Review
                          </Link>
                        ) : isTodayDate ? (
                          <button type="button" className="btn btn-xs btn-primary" onClick={() => startOccurrence(occurrence)}>
                            Start
                          </button>
                        ) : isPast ? (
                          <span className="tiny muted">—</span>
                        ) : (
                          <span className="tiny muted">Planned</span>
                        )}
                      </div>
                    );
                  })}

                  {selectedSessions
                    .filter((session) => !selectedOccurrences.some((occurrence) => occurrence.completedSessionId === session.id))
                    .map((session) => (
                      <Link to={`/history/${session.id}`} className="agenda-card" key={session.id}>
                        <div className="agenda-time">
                          <Dumbbell size={14} />
                          <span>Logged</span>
                        </div>
                        <div className="grow">
                          <p className="strong small">{session.name}</p>
                          <p className="tiny muted">
                            {formatVolume(sessionVolumeKg(session), profile.unitSystem)} · {formatDuration(sessionDurationMinutes(session) * 60)}
                          </p>
                        </div>
                        <ChevronRight size={15} className="muted" />
                      </Link>
                    ))}
                </div>
              )}

              <div className="agenda-quick">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setPaletteSheetOpen(true)}>
                  <Plus /> Schedule a day
                </button>
                <Link to="/workouts" className="btn btn-sm btn-ghost">
                  <Dumbbell /> Start something else
                </Link>
              </div>
            </section>

            <section className="calendar-week-card card">
              <div className="between" style={{ marginBottom: 9 }}>
                <p className="eyebrow">This week</p>
                <Link to="/progress" className="section-link">
                  Progress <ChevronRight size={13} />
                </Link>
              </div>
              {weekOccurrences.length === 0 ? (
                <p className="tiny muted">No sessions scheduled this week.</p>
              ) : (
                <div className="week-mini-list">
                  {weekOccurrences.map((occurrence) => {
                    const completed = Boolean(occurrence.completedSessionId);
                    return (
                      <button
                        type="button"
                        key={occurrence.key}
                        className="week-mini-row"
                        data-completed={completed}
                        onClick={() => goToDate(occurrence.date)}
                      >
                        <span className="week-mini-day">{fromKey(occurrence.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="grow truncate">{occurrence.dayName.replace(/^Day \d+ — /, '')}</span>
                        {completed ? <CheckCircle2 size={14} className="mint" /> : <span className="week-mini-dot" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Repeating schedule</h2>
              <span className="badge">{scheduleRules.length}</span>
            </div>
            {scheduleRules.length === 0 ? (
              <EmptyState
                icon={<Repeat />}
                title="No repeating sessions yet"
                text="Schedule a programme day, then choose weekly or daily to make it repeat automatically."
              />
            ) : (
              <div className="stack-sm">
                {scheduleRules
                  .slice()
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((rule) => {
                    const program = programs.find((item) => item.id === rule.programId);
                    const day = program?.days.find((item) => item.id === rule.programDayId);
                    return (
                      <div className="card card-sm repeat-row" key={rule.id} data-inactive={!rule.active}>
                        <span className={`entity-icon ${rule.active ? 'entity-icon-violet' : ''}`}>
                          <Repeat />
                        </span>
                        <div className="grow">
                          <p className="strong small">{day?.name ?? 'Training day'}</p>
                          <p className="tiny muted">
                            {program?.name ?? 'Programme'} · {recurrenceLabel(rule)}
                          </p>
                          <p className="tiny muted">Starts {rule.startDate}{rule.endDate ? ` · ends ${rule.endDate}` : ''}</p>
                        </div>
                        <div className="row" style={{ gap: 6 }}>
                          <button
                            type="button"
                            className="switch"
                            role="switch"
                            aria-checked={rule.active}
                            aria-label={rule.active ? 'Pause repeating schedule' : 'Resume repeating schedule'}
                            onClick={() => toggleScheduleRule(rule.id)}
                          />
                          <button
                            type="button"
                            className="icon-btn icon-btn-sm"
                            onClick={() =>
                              openSchedule(rule.programId, rule.programDayId, rule.startDate, rule.id)
                            }
                            aria-label="Edit repeating schedule"
                          >
                            <CalendarDays />
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn-sm"
                            onClick={() => setRuleToDelete(rule.id)}
                            aria-label="Delete repeating schedule"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        </div>
      </div>

      <Sheet
        open={paletteSheetOpen}
        onClose={() => setPaletteSheetOpen(false)}
        title="Schedule a training day"
        subtitle="Pick a day to place on the calendar."
      >
        {programs.length === 0 ? (
          <EmptyState icon={<Dumbbell />} title="No programmes yet" text="Create a programme first." />
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
                      key={day.id}
                      className="day-pick-row"
                      onClick={() => {
                        setPaletteSheetOpen(false);
                        openSchedule(program.id, day.id, selectedDate);
                      }}
                    >
                      <span className="entity-icon entity-icon-lime">
                        <Dumbbell />
                      </span>
                      <span className="grow">
                        <span className="strong small">{day.name}</span>
                        <span className="tiny muted">
                          {day.focus} · {estimateProgramDayMinutes(day)} min
                        </span>
                      </span>
                      <CalendarDays size={16} className="muted" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Sheet>

      <ScheduleSheet
        open={Boolean(scheduleTarget)}
        onClose={() => {
          setScheduleTarget(null);
          setViewMonth(fromKey(selectedDate));
        }}
        programId={scheduleTarget?.programId ?? null}
        programDayId={scheduleTarget?.dayId ?? null}
        date={scheduleTarget?.date ?? selectedDate}
        ruleId={scheduleTarget?.ruleId}
      />

      <ConfirmSheet
        open={Boolean(ruleToDelete)}
        onClose={() => setRuleToDelete(null)}
        title="Delete this repeating schedule?"
        message="Future occurrences will disappear from the calendar. Workouts you already completed are kept."
        confirmLabel="Delete schedule"
        danger
        onConfirm={() => {
          if (ruleToDelete) {
            deleteScheduleRule(ruleToDelete);
            toast('Repeating schedule deleted.', 'success');
          }
        }}
      />

      <p className="sr-only" aria-live="polite">
        {dragging ? `Dragging ${dragging.label}. Drop on a date.` : ''}
      </p>
    </div>
  );
}
