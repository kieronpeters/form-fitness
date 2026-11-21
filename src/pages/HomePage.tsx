import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Apple,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Dumbbell,
  Flame,
  Moon,
  NotebookPen,
  Play,
  Plus,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useAppStore, getActiveSession } from '../store/appStore';
import { addDaysKey, relTime, toDisplayDate, todayKey } from '../lib/date';
import { expandSchedule } from '../lib/schedule';
import { getExercise } from '../data/exercises';
import { ARTICLES } from '../data/articles';
import {
  nutritionTargets,
  entriesForDate,
  macroTotals,
  roundMacros,
} from '../lib/nutrition';
import { latestBodyEntry, recoveryScore } from '../lib/body';
import { volumeThisWeek, weekStreak, weeklySeries, workoutsThisWeek } from '../lib/stats';
import { formatDuration, formatVolume, formatWeight } from '../lib/units';
import { sessionDurationMinutes, sessionVolumeKg } from '../lib/workout';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Avatar } from '../components/ui/Avatar';
import { BarChart } from '../components/charts/Charts';
import { getGoalProgressSummary } from '../lib/home';

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function HomePage() {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const settings = useAppStore((state) => state.settings);
  const programs = useAppStore((state) => state.programs);
  const sessions = useAppStore((state) => state.sessions);
  const scheduleRules = useAppStore((state) => state.scheduleRules);
  const foodEntries = useAppStore((state) => state.foodEntries);
  const bodyEntries = useAppStore((state) => state.bodyEntries);
  const goals = useAppStore((state) => state.goals);
  const startWorkoutFromDay = useAppStore((state) => state.startWorkoutFromDay);
  const startEmptyWorkout = useAppStore((state) => state.startEmptyWorkout);
  const activeSession = useAppStore((state) => getActiveSession(state));

  const today = todayKey();
  const weekTarget = profile.weeklyTarget;
  const completedThisWeek = workoutsThisWeek(sessions, settings.firstDayOfWeek);
  const volume = volumeThisWeek(sessions, settings.firstDayOfWeek);
  const streak = weekStreak(sessions, settings.firstDayOfWeek);
  const recentSessions = sessions
    .filter((session) => session.status === 'completed')
    .sort((a, b) => new Date(b.completedAt ?? b.startedAt).getTime() - new Date(a.completedAt ?? a.startedAt).getTime())
    .slice(0, 3);
  const targets = nutritionTargets(profile, settings);
  const todayFood = entriesForDate(foodEntries, today);
  const macros = roundMacros(macroTotals(todayFood));
  const caloriesLeft = Math.max(0, targets.calories - macros.calories);
  const todayBody = bodyEntries.find((entry) => entry.date === today) ?? latestBodyEntry(bodyEntries);
  const recovery = recoveryScore(todayBody);
  const goalSummary = getGoalProgressSummary(goals, sessions, bodyEntries, profile);
  const featured = ARTICLES.find((article) => article.featured) ?? ARTICLES[0];

  const { todayOccurrence, nextOccurrence, todayDay } = useMemo(() => {
    const upcoming = expandSchedule(scheduleRules, programs, sessions, { from: today, to: addDaysKey(today, 14) });
    const todayItem = upcoming.find((occurrence) => occurrence.date === today);
    const nextItem = upcoming.find((occurrence) => occurrence.date > today && !occurrence.completedSessionId) ?? upcoming.find((occurrence) => occurrence.date > today);
    const day = todayItem
      ? programs.find((program) => program.id === todayItem.programId)?.days.find((item) => item.id === todayItem.programDayId)
      : undefined;
    return { todayOccurrence: todayItem, nextOccurrence: nextItem, todayDay: day };
  }, [scheduleRules, programs, sessions, today]);

  const weekSeries = weeklySeries(sessions, 6, settings.firstDayOfWeek).map((point, index) => ({
    label: index === 5 ? 'This wk' : `W${index + 1}`,
    value: Math.round(point.volumeKg),
  }));

  const handleStartToday = () => {
    if (activeSession) {
      navigate(`/session/${activeSession.id}`);
      return;
    }
    if (!todayOccurrence) return;
    const id = startWorkoutFromDay(todayOccurrence.programId, todayOccurrence.programDayId, {
      scheduledDate: today,
      scheduledRuleId: todayOccurrence.ruleId,
    });
    if (id) navigate(`/session/${id}`);
  };

  const handleEmptyWorkout = () => {
    const id = startEmptyWorkout();
    if (id) navigate(`/session/${id}`);
  };

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const calorieProgress = Math.min(1, macros.calories / Math.max(1, targets.calories));
  const completedToday = todayOccurrence?.completedSessionId
    ? sessions.find((session) => session.id === todayOccurrence.completedSessionId)
    : undefined;

  return (
    <div className="page-enter home-page">
      <header className="home-head">
        <div className="row" style={{ gap: 12 }}>
          <Avatar name={profile.name} src={profile.avatarUrl} size={46} />
          <div>
            <p className="eyebrow">{dateLabel}</p>
            <h1 className="home-greeting">Let’s move, {firstName(profile.name)}.</h1>
          </div>
        </div>
        <Link to="/profile" aria-label="Open settings" className="icon-btn icon-btn-bordered">
          <Sparkles />
        </Link>
      </header>

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
          </span>
          <span className="btn btn-sm btn-primary">
            Resume <Play size={15} />
          </span>
        </Link>
      )}

      <div className="home-grid">
        <div className="home-main">
          {todayOccurrence && completedToday ? (
            <section className="card today-done">
              <div className="row" style={{ gap: 12 }}>
                <span className="entity-icon entity-icon-lime">
                  <CircleCheck />
                </span>
                <div className="grow">
                  <p className="eyebrow">Today’s session · complete</p>
                  <h2 className="today-title">{todayOccurrence.dayName}</h2>
                  <p className="small muted">
                    {formatVolume(sessionVolumeKg(completedToday), profile.unitSystem)} · {formatDuration(sessionDurationMinutes(completedToday) * 60)} ·{' '}
                    {completedToday.exercises.length} exercises
                  </p>
                </div>
                <Link to={`/history/${completedToday.id}`} className="btn btn-sm btn-secondary">
                  Review
                </Link>
              </div>
              <div className="today-done-footer">
                <span>
                  <Flame size={14} /> Weekly streak: {streak.weeks} {streak.weeks === 1 ? 'week' : 'weeks'}
                </span>
                <Link to="/calendar" className="section-link">
                  See week <ChevronRight />
                </Link>
              </div>
            </section>
          ) : todayOccurrence ? (
            <section className="hero today-hero">
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <p className="eyebrow">Today · {todayOccurrence.programName}</p>
                  <h2 className="hero-title">{todayOccurrence.dayName}</h2>
                  <p className="hero-sub">{todayOccurrence.focus}</p>
                </div>
                <span className="today-time">
                  <Timer size={14} /> {todayOccurrence.estimatedMinutes} min
                </span>
              </div>
              <div className="today-exercise-list">
                {todayDay?.exercises.slice(0, 3).map((exercise) => {
                  const info = getExercise(exercise.exerciseId);
                  return (
                    <span key={exercise.id} className="today-exercise-pill">
                      {info?.name ?? 'Exercise'} <b>{exercise.sets}×{exercise.repsMin}–{exercise.repsMax}</b>
                    </span>
                  );
                })}
                {(todayDay?.exercises.length ?? 0) > 3 && (
                  <span className="today-exercise-pill">+{(todayDay?.exercises.length ?? 0) - 3} more</span>
                )}
              </div>
              <div className="hero-actions">
                <button type="button" className="btn btn-primary" onClick={handleStartToday}>
                  Start workout <ArrowRight size={17} />
                </button>
                <Link to="/calendar" className="btn btn-ghost">
                  View week
                </Link>
              </div>
            </section>
          ) : (
            <section className="hero hero-dark rest-hero">
              <p className="eyebrow">Today’s plan</p>
              <h2 className="hero-title">Rest day. Recover on purpose.</h2>
              <p className="hero-sub">
                No session scheduled today. Sleep, walk, eat well — or start something light if you feel good.
              </p>
              {nextOccurrence && (
                <p className="next-session">
                  Next up · {toDisplayDate(nextOccurrence.date)} — {nextOccurrence.dayName}
                </p>
              )}
              <div className="hero-actions">
                <button type="button" className="btn btn-primary" onClick={handleEmptyWorkout}>
                  Start freestyle <Plus size={17} />
                </button>
                <Link to="/calendar" className="btn btn-ghost">
                  Plan the week
                </Link>
              </div>
            </section>
          )}

          <section className="status-card card">
            <ProgressRing
              value={weekTarget > 0 ? completedThisWeek / weekTarget : 0}
              size={92}
              stroke={8}
              number={`${completedThisWeek}`}
              label={`of ${weekTarget}`}
              ariaLabel={`${completedThisWeek} of ${weekTarget} workouts this week`}
            />
            <div className="status-card-divider" />
            <div className="status-grid">
              <div>
                <p className="stat-value">
                  {formatVolume(volume, profile.unitSystem).replace(` ${profile.unitSystem === 'imperial' ? 'lb' : 'kg'}`, '')}
                  <small>{profile.unitSystem === 'imperial' ? 'lb' : 'kg'}</small>
                </p>
                <p className="stat-label">
                  <TrendingUp /> Week volume
                </p>
              </div>
              <div>
                <p className="stat-value">
                  {streak.weeks}
                  <small>wk</small>
                </p>
                <p className="stat-label">
                  <Flame /> Streak
                </p>
              </div>
              <div>
                <p className="stat-value">
                  {macros.protein}
                  <small>g</small>
                </p>
                <p className="stat-label">
                  <Apple /> Protein
                </p>
              </div>
              <div>
                <p className="stat-value">{recovery ?? '—'}</p>
                <p className="stat-label">
                  <Zap /> Readiness
                </p>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Recent training</h2>
              <Link to="/history" className="section-link">
                History <ChevronRight />
              </Link>
            </div>
            {recentSessions.length === 0 ? (
              <div className="card empty-inline">
                <span className="entity-icon entity-icon-lime">
                  <Dumbbell />
                </span>
                <div className="grow">
                  <p className="strong">Your log starts with one session</p>
                  <p className="small muted">Start today’s workout or a freestyle session and it will appear here.</p>
                </div>
                <button type="button" className="btn btn-sm btn-primary" onClick={handleEmptyWorkout}>
                  Start
                </button>
              </div>
            ) : (
              <div className="list recent-list">
                {recentSessions.map((session) => (
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

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Quick actions</h2>
            </div>
            <div className="quick-grid">
              <button type="button" className="quick-action" onClick={handleEmptyWorkout}>
                <span className="entity-icon entity-icon-lime">
                  <Dumbbell />
                </span>
                <span>Empty workout</span>
              </button>
              <Link to="/food" className="quick-action">
                <span className="entity-icon entity-icon-coral">
                  <Apple />
                </span>
                <span>Log food</span>
              </Link>
              <Link to="/diary?checkin=1" className="quick-action">
                <span className="entity-icon entity-icon-blue">
                  <NotebookPen />
                </span>
                <span>Daily check-in</span>
              </Link>
              <Link to="/calendar" className="quick-action">
                <span className="entity-icon entity-icon-violet">
                  <CalendarDays />
                </span>
                <span>Plan a session</span>
              </Link>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Your goals</h2>
              <Link to="/goals" className="section-link">
                All goals <ChevronRight />
              </Link>
            </div>
            {goalSummary.length === 0 ? (
              <div className="card empty-inline">
                <span className="entity-icon entity-icon-gold">
                  <Target />
                </span>
                <div className="grow">
                  <p className="strong">Set a target worth chasing</p>
                  <p className="small muted">Workout counts, streaks, bodyweight or a lift PR.</p>
                </div>
                <Link to="/goals" className="btn btn-sm btn-secondary">
                  Create
                </Link>
              </div>
            ) : (
              <div className="stack-sm">
                {goalSummary.slice(0, 2).map((item) => (
                  <div className="card card-sm goal-mini" key={item.goal.id}>
                    <div className="between">
                      <p className="strong small">{item.goal.title}</p>
                      <span className="badge badge-lime">{item.progress.percent}%</span>
                    </div>
                    <div className="bar mt-2">
                      <span className="bar-fill" style={{ width: `${item.progress.percent}%` }} />
                    </div>
                    <p className="tiny muted mt-1">{item.progress.headline}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="home-aside">
          <section className="card nutrition-mini">
            <div className="between">
              <div>
                <p className="eyebrow">Nutrition today</p>
                <p className="chart-value">{macros.calories.toLocaleString('en-US')} kcal</p>
                <p className="tiny muted">
                  {caloriesLeft > 0 ? `${caloriesLeft.toLocaleString('en-US')} left` : 'Target reached'} · {targets.calories.toLocaleString('en-US')} target
                </p>
              </div>
              <ProgressRing
                value={calorieProgress}
                size={72}
                stroke={7}
                number={`${Math.round(calorieProgress * 100)}%`}
                tone="var(--coral)"
                ariaLabel="Calories consumed"
              />
            </div>
            <div className="stack-sm mt-3">
              {[
                { label: 'Protein', value: macros.protein, target: targets.protein, tone: 'lime' },
                { label: 'Carbs', value: macros.carbs, target: targets.carbs, tone: 'blue' },
                { label: 'Fat', value: macros.fat, target: targets.fat, tone: 'gold' },
              ].map((macro) => (
                <div className="macro-row" key={macro.label}>
                  <div className="macro-row-head">
                    <span>{macro.label}</span>
                    <span>
                      <strong>{macro.value}</strong> / {macro.target} g
                    </span>
                  </div>
                  <span className="bar">
                    <span
                      className="bar-fill"
                      data-tone={macro.tone === 'lime' ? undefined : macro.tone}
                      style={{ width: `${Math.min(100, (macro.value / Math.max(1, macro.target)) * 100)}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
            <Link to="/food" className="btn btn-secondary btn-sm btn-block mt-3">
              <Plus size={15} /> Add food
            </Link>
          </section>

          <section className="card recovery-mini">
            <div className="between">
              <p className="eyebrow">Recovery check</p>
              <Link to="/diary" className="section-link">
                Diary <ChevronRight />
              </Link>
            </div>
            {recovery !== null && todayBody ? (
              <>
                <div className="recovery-score-row">
                  <span className="recovery-score">{recovery}</span>
                  <div>
                    <p className="strong small">{recovery >= 75 ? 'Ready to push' : recovery >= 55 ? 'Train, but listen' : 'Prioritise recovery'}</p>
                    <p className="tiny muted">
                      {todayBody.sleepHours ? `${todayBody.sleepHours}h sleep` : 'Sleep not logged'}
                      {todayBody.energy ? ` · energy ${todayBody.energy}/5` : ''}
                      {todayBody.soreness ? ` · soreness ${todayBody.soreness}/5` : ''}
                    </p>
                  </div>
                </div>
                {todayBody.date !== today && (
                  <Link to="/diary?checkin=1" className="btn btn-sm btn-secondary btn-block mt-2">
                    Add today’s check-in
                  </Link>
                )}
              </>
            ) : (
              <>
                <p className="strong small mt-2">How are you feeling today?</p>
                <p className="tiny muted">Sleep, energy and soreness feed your readiness score.</p>
                <Link to="/diary?checkin=1" className="btn btn-sm btn-secondary btn-block mt-2">
                  <Moon size={14} /> Check in
                </Link>
              </>
            )}
          </section>

          <section className="card report-mini">
            <div className="between">
              <div>
                <p className="eyebrow">Volume trend</p>
                <p className="chart-value">{formatVolume(volume, profile.unitSystem)}</p>
                <p className="tiny muted">This week</p>
              </div>
              <Link to="/progress" className="btn btn-sm btn-secondary">
                Report <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-3">
              {sessions.some((session) => session.status === 'completed') ? (
                <BarChart
                  points={weekSeries}
                  height={120}
                  formatValue={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`)}
                />
              ) : (
                <div className="chart-empty">Log a session and your weekly volume will build here.</div>
              )}
            </div>
          </section>

          <section className="card article-mini">
            <p className="eyebrow">Read of the month</p>
            <Link to={`/learn/${featured.slug}`} className="article-mini-link">
              <h3>{featured.title}</h3>
              <p className="tiny muted clamp-2">{featured.excerpt}</p>
              <span className="badge badge-lime mt-2">
                {featured.category} · {featured.readMinutes} min
              </span>
            </Link>
          </section>

          <section className="card profile-mini">
            <div className="row" style={{ gap: 10 }}>
              <Avatar name={profile.name} src={profile.avatarUrl} size={38} />
              <div className="grow">
                <p className="strong small">{profile.name}</p>
                <p className="tiny muted">
                  {profile.weeklyTarget} days/week · {formatWeight(profile.weightKg, profile.unitSystem, { decimals: 1 })}
                </p>
              </div>
              <Link to="/profile" className="icon-btn icon-btn-sm" aria-label="Open profile">
                <ChevronRight />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
