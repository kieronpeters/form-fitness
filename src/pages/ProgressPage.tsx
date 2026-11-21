import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Camera,
  ChevronLeft,
  ChevronRight,
  Copy,
  Dumbbell,
  Flame,
  ImageOff,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Segmented } from '../components/ui/Segmented';
import { Sheet } from '../components/ui/Sheet';
import { BarChart, LineChart, MuscleBars, Sparkline } from '../components/charts/Charts';
import { PhotoThumb } from '../components/ui/PhotoThumb';
import { usePhotoUrl } from '../hooks/usePhotoUrl';
import {
  buildReport,
  rangeStats,
  sessionsInRange,
  weekStreak,
  weeklySeries,
  muscleDistribution,
  exerciseSummaryStats,
  sessionLocalDate,
} from '../lib/stats';
import { computePRs } from '../lib/workout';
import { formatVolume, formatWeight } from '../lib/units';
import { addDaysKey, startOfWeekKey, todayKey } from '../lib/date';
import { evaluateAchievements } from '../lib/achievements';
import { getExercise } from '../data/exercises';
import type { SessionPhoto } from '../types';
import { toast } from '../store/toastStore';

type Tab = 'overview' | 'reports' | 'photos';
type Range = '4' | '12' | '26';

const POSE_LABELS: Record<SessionPhoto['pose'], string> = {
  front: 'Front',
  side: 'Side',
  free: 'Freeform',
};

export function ProgressPage() {
  const [searchParams] = useSearchParams();
  const sessions = useAppStore((state) => state.sessions);
  const profile = useAppStore((state) => state.profile);
  const settings = useAppStore((state) => state.settings);
  const photos = useAppStore((state) => state.sessionPhotos);
  const goals = useAppStore((state) => state.goals);
  const bodyEntries = useAppStore((state) => state.bodyEntries);
  const customExercises = useAppStore((state) => state.customExercises);

  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'overview';
  const [tab, setTab] = useState<Tab>(['overview', 'reports', 'photos'].includes(initialTab) ? initialTab : 'overview');
  const [range, setRange] = useState<Range>('12');
  const [poseFilter, setPoseFilter] = useState<'all' | SessionPhoto['pose']>('all');
  const [lightbox, setLightbox] = useState<SessionPhoto | null>(null);
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const today = todayKey();
  const weeks = Number(range);
  const rangeStart = addDaysKey(startOfWeekKey(today, settings.firstDayOfWeek), -(weeks - 1) * 7);
  const rangedSessions = useMemo(() => sessionsInRange(sessions, rangeStart, today), [sessions, rangeStart, today]);
  const stats = useMemo(() => rangeStats(sessions, rangeStart, today, photos), [sessions, rangeStart, today, photos]);
  const series = useMemo(() => weeklySeries(sessions, weeks, settings.firstDayOfWeek), [sessions, weeks, settings.firstDayOfWeek]);
  const muscleData = useMemo(() => muscleDistribution(rangedSessions, customExercises), [rangedSessions, customExercises]);
  const prs = useMemo(
    () =>
      Object.values(computePRs(sessions))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [sessions],
  );
  const streak = weekStreak(sessions, settings.firstDayOfWeek);
  const achievementList = useMemo(
    () => evaluateAchievements({ sessions, photos, goals, bodyEntries, profile, customExercises }),
    [sessions, photos, goals, bodyEntries, profile, customExercises],
  );
  const unlockedAchievements = achievementList.filter((achievement) => achievement.unlocked);
  const topExercises = useMemo(() => exerciseSummaryStats(rangedSessions, customExercises).slice(0, 4), [rangedSessions, customExercises]);
  const heatmap = useMemo(() => buildHeatmap(sessions, 12), [sessions]);
  const weightPoints = useMemo(() => {
    const withWeight = bodyEntries.filter((entry) => entry.weightKg).sort((a, b) => a.date.localeCompare(b.date)).slice(-12);
    return withWeight.map((entry) => ({
      label: new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number(((entry.weightKg ?? 0) * (profile.unitSystem === 'imperial' ? 2.2046 : 1)).toFixed(1)),
    }));
  }, [bodyEntries, profile.unitSystem]);

  const report = useMemo(
    () => buildReport(sessions, reportMonth.year, reportMonth.month, profile.unitSystem, photos, customExercises),
    [sessions, reportMonth, profile.unitSystem, photos, customExercises],
  );

  const shiftReportMonth = (delta: number) => {
    const date = new Date(reportMonth.year, reportMonth.month + delta, 1);
    setReportMonth({ year: date.getFullYear(), month: date.getMonth() });
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report.summaryText);
      toast('Report copied to clipboard.', 'success');
    } catch {
      toast('Could not copy — your browser blocked clipboard access.', 'error');
    }
  };

  const filteredPhotos = photos
    .filter((photo) => poseFilter === 'all' || photo.pose === poseFilter)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const pairs = (['front', 'side'] as const).map((pose) => {
    const list = photos.filter((photo) => photo.pose === pose).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { pose, first: list[0] ?? null, last: list.length > 1 ? list[list.length - 1] : null };
  });

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Progress"
        title="Your training, measured"
        subtitle="Volume, consistency, strength and the visual record. No vanity metrics without context."
        actions={
          <Link to="/goals" className="btn btn-secondary btn-sm">
            <Target /> Goals
          </Link>
        }
      />

      <div className="progress-tabs">
        <Segmented
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'reports', label: 'Reports' },
            { value: 'photos', label: 'Photos' },
          ]}
          value={tab}
          onChange={(value) => setTab(value as Tab)}
          ariaLabel="Progress sections"
        />
      </div>

      {tab === 'overview' && (
        <>
          <div className="progress-range-row">
            <Segmented
              options={[
                { value: '4', label: '4 weeks' },
                { value: '12', label: '12 weeks' },
                { value: '26', label: '26 weeks' },
              ]}
              value={range}
              onChange={(value) => setRange(value as Range)}
              ariaLabel="Date range"
            />
          </div>

          <section className="progress-hero card">
            <div className="progress-hero-main">
              <p className="eyebrow">Last {weeks} weeks</p>
              <h2 className="progress-hero-title">{stats.workouts} workouts</h2>
              <p className="small muted">
                {formatVolume(stats.volumeKg, profile.unitSystem)} moved · {Math.round(stats.durationMin / 60)} hours under the bar
              </p>
              <div className="streak-inline">
                <Flame size={15} />
                <b>{streak.weeks} week streak</b>
                <span className="muted">· {unlockedAchievements.length} badges</span>
              </div>
            </div>
            <div className="progress-hero-stats">
              <div>
                <span className="stat-value">{Math.round(stats.workouts / weeks * 10) / 10}</span>
                <span className="stat-label">per week</span>
              </div>
              <div>
                <span className="stat-value">{stats.sets}</span>
                <span className="stat-label">working sets</span>
              </div>
              <div>
                <span className="stat-value">{stats.avgDurationMin}<small>m</small></span>
                <span className="stat-label">avg. session</span>
              </div>
            </div>
          </section>

          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <p className="chart-title">Weekly volume</p>
                  <p className="chart-sub">Working-set tonnage</p>
                </div>
                <span className="chart-value">{formatVolume(stats.volumeKg, profile.unitSystem)}</span>
              </div>
              <BarChart
                points={series.map((point) => ({
                  label: new Date(`${point.weekStart}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(',', ''),
                  value: Math.round(point.volumeKg),
                }))}
                formatValue={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`)}
                ariaLabel="Weekly training volume"
                emptyLabel="Your weekly volume will appear after your first completed workout."
              />
            </div>

            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <p className="chart-title">Consistency</p>
                  <p className="chart-sub">Workouts per week</p>
                </div>
                <span className="chart-value">{streak.weeks}w streak</span>
              </div>
              <BarChart
                points={series.map((point) => ({
                  label: new Date(`${point.weekStart}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(',', ''),
                  value: point.workouts,
                }))}
                formatValue={(value) => `${value}`}
                ariaLabel="Workouts per week"
                emptyLabel="Complete a workout to start your consistency chart."
              />
            </div>

            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <p className="chart-title">Muscle balance</p>
                  <p className="chart-sub">Weighted sets per week</p>
                </div>
              </div>
              <MuscleBars data={muscleData} />
            </div>

            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <p className="chart-title">Bodyweight</p>
                  <p className="chart-sub">Last 12 check-ins</p>
                </div>
                <Link to="/diary" className="section-link">
                  Diary <ChevronRight size={13} />
                </Link>
              </div>
              <LineChart
                points={weightPoints}
                ariaLabel="Bodyweight trend"
                formatValue={(value) => Number(value).toFixed(1)}
                emptyLabel="Add weight in a daily check-in to see the trend."
              />
            </div>
          </div>

          <div className="progress-columns">
            <section className="card">
              <div className="section-head" style={{ marginBottom: 8 }}>
                <div>
                  <h2 className="section-title" style={{ fontSize: '1rem' }}>
                    Personal bests
                  </h2>
                  <p className="tiny muted">Best estimated 1RM by lift</p>
                </div>
                <Star size={16} className="gold" />
              </div>
              {prs.length === 0 ? (
                <p className="small muted">Log a few working sets and your best lifts will appear here.</p>
              ) : (
                <div className="pr-list">
                  {prs.map((record) => (
                    <Link to={`/library/${record.exerciseId}`} className="pr-list-row" key={record.exerciseId}>
                      <span className="grow">
                        <span className="strong small">{getExercise(record.exerciseId, customExercises)?.name ?? 'Lift'}</span>
                        <span className="tiny muted">
                          {formatWeight(record.weightKg, profile.unitSystem)} × {record.reps} · {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </span>
                      <span className="badge badge-gold">{Math.round(record.estimated1RM)} kg</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <div className="section-head" style={{ marginBottom: 8 }}>
                <div>
                  <h2 className="section-title" style={{ fontSize: '1rem' }}>
                    Exercise trends
                  </h2>
                  <p className="tiny muted">Most-trained lifts in this range</p>
                </div>
                <TrendingUp size={16} className="lime" />
              </div>
              {topExercises.length === 0 ? (
                <p className="small muted">Complete a workout to see which lifts move most.</p>
              ) : (
                <div className="exercise-trend-list">
                  {topExercises.map((item) => (
                    <Link to={`/library/${item.exerciseId}`} className="exercise-trend-row" key={item.exerciseId}>
                      <div className="grow">
                        <p className="strong small">{getExercise(item.exerciseId, customExercises)?.name ?? 'Exercise'}</p>
                        <p className="tiny muted">
                          {item.sets} sets · {formatVolume(item.volumeKg, profile.unitSystem)} · best {Math.round(item.best1RM)} kg
                        </p>
                      </div>
                      <Sparkline values={item.trend} ariaLabel={`${getExercise(item.exerciseId, customExercises)?.name} trend`} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="card consistency-card">
            <div className="between">
              <div>
                <h2 className="section-title" style={{ fontSize: '1rem' }}>
                  Training rhythm
                </h2>
                <p className="tiny muted">Last 12 weeks · one square per day</p>
              </div>
              <div className="heatmap-legend">
                <span className="tiny muted">Less</span>
                <i data-level="0" />
                <i data-level="1" />
                <i data-level="2" />
                <i data-level="3" />
                <span className="tiny muted">More</span>
              </div>
            </div>
            <div className="heatmap">
              <div className="heatmap-days">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
              <div className="heatmap-weeks">
                {heatmap.map((week) => (
                  <div className="heatmap-week" key={week[0]?.date ?? Math.random()}>
                    {week.map((day) => (
                      <span
                        key={day.date}
                        className="heatmap-cell"
                        data-level={day.level}
                        title={`${day.date}: ${day.workouts} workout${day.workouts === 1 ? '' : 's'}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Badges</h2>
              <Link to="/goals" className="section-link">
                All achievements <ChevronRight size={13} />
              </Link>
            </div>
            <div className="badge-strip">
              {unlockedAchievements.length === 0 ? (
                <div className="card card-sm" style={{ width: '100%' }}>
                  <p className="small muted">Your first badge is one completed workout away.</p>
                </div>
              ) : (
                unlockedAchievements.slice(0, 5).map((achievement) => (
                  <Link to="/goals" key={achievement.id} className="badge-card" data-tone={achievement.tone}>
                    <Trophy size={17} />
                    <span>{achievement.title}</span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {tab === 'reports' && (
        <>
          <section className="report-hero card">
            <div className="between">
              <div>
                <p className="eyebrow">Monthly report</p>
                <h2 className="report-title">{report.label}</h2>
                <p className="small muted">A snapshot of what the month actually contained.</p>
              </div>
              <div className="report-nav">
                <button type="button" className="icon-btn icon-btn-sm icon-btn-bordered" onClick={() => shiftReportMonth(-1)} aria-label="Previous month">
                  <ChevronLeft />
                </button>
                <button type="button" className="icon-btn icon-btn-sm icon-btn-bordered" onClick={() => shiftReportMonth(1)} aria-label="Next month">
                  <ChevronRight />
                </button>
              </div>
            </div>
            <div className="report-stats">
              <div>
                <span className="stat-value">{report.workouts}</span>
                <span className="stat-label">workouts</span>
                <Delta current={report.workouts} previous={report.previousWorkouts} unit="" />
              </div>
              <div>
                <span className="stat-value">{formatVolume(report.volumeKg, profile.unitSystem)}</span>
                <span className="stat-label">volume</span>
                <Delta current={report.volumeKg} previous={report.previousVolumeKg} unit="" />
              </div>
              <div>
                <span className="stat-value">{Math.round(report.durationMin / 60)}<small>h</small></span>
                <span className="stat-label">training time</span>
                <Delta current={report.durationMin} previous={report.previousDurationMin} unit="" />
              </div>
              <div>
                <span className="stat-value">{report.sets}</span>
                <span className="stat-label">working sets</span>
              </div>
              <div>
                <span className="stat-value">{report.trainingDays}</span>
                <span className="stat-label">training days</span>
              </div>
              <div>
                <span className="stat-value">{report.prs.length}</span>
                <span className="stat-label">best lifts</span>
              </div>
            </div>
            <div className="report-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={copyReport}>
                <Copy /> Copy summary
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('photos')}>
                <Camera /> Photo journal
              </button>
            </div>
          </section>

          <section className="card report-insights">
            <div className="row" style={{ gap: 9 }}>
              <span className="entity-icon entity-icon-lime">
                <Sparkles />
              </span>
              <div className="grow">
                <p className="eyebrow">What the data says</p>
                <h2 className="section-title" style={{ fontSize: '1rem' }}>
                  Plain-language insights
                </h2>
              </div>
            </div>
            <ul className="insight-list">
              {report.insights.map((insight) => (
                <li key={insight}>
                  <span className="insight-dot" />
                  {insight}
                </li>
              ))}
            </ul>
            <p className="tiny muted">Based only on logged sessions in this month. Estimates, not medical advice.</p>
          </section>

          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <p className="chart-title">Weekly breakdown</p>
                  <p className="chart-sub">Volume by week · {report.label}</p>
                </div>
              </div>
              <BarChart
                points={report.weeks.map((week) => ({ label: week.label, value: Math.round(week.volumeKg) }))}
                formatValue={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`)}
                ariaLabel="Weekly volume in report month"
              />
            </div>
            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <p className="chart-title">Muscle focus</p>
                  <p className="chart-sub">Weighted sets this month</p>
                </div>
              </div>
              <MuscleBars data={report.muscles} />
            </div>
            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <p className="chart-title">Top exercises</p>
                  <p className="chart-sub">By working-set volume</p>
                </div>
              </div>
              {report.topExercises.length === 0 ? (
                <p className="small muted">No sessions in this month.</p>
              ) : (
                <div className="report-table">
                  {report.topExercises.map((item, index) => (
                    <div className="report-table-row" key={item.exerciseId}>
                      <span className="report-rank">{index + 1}</span>
                      <span className="grow">
                        <span className="strong small">{getExercise(item.exerciseId, customExercises)?.name ?? 'Exercise'}</span>
                        <span className="tiny muted">
                          {item.sets} sets · {item.sessions} sessions
                        </span>
                      </span>
                      <span className="small numeric">{formatVolume(item.volumeKg, profile.unitSystem)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <p className="chart-title">Best lifts</p>
                  <p className="chart-sub">Top estimated 1RMs set this month</p>
                </div>
                <Star size={16} className="gold" />
              </div>
              {report.prs.length === 0 ? (
                <p className="small muted">No working sets with weight in this month.</p>
              ) : (
                <div className="report-table">
                  {report.prs.slice(0, 5).map((record) => (
                    <div className="report-table-row" key={record.exerciseId}>
                      <span className="entity-icon entity-icon-gold" style={{ width: 34, height: 34, borderRadius: 10 }}>
                        <Trophy size={15} />
                      </span>
                      <span className="grow">
                        <span className="strong small">{getExercise(record.exerciseId, customExercises)?.name ?? 'Lift'}</span>
                        <span className="tiny muted">
                          {formatWeight(record.weightKg, profile.unitSystem)} × {record.reps}
                        </span>
                      </span>
                      <span className="badge badge-gold">{Math.round(record.estimated1RM)} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <section className="card report-summary">
            <div className="between">
              <div>
                <p className="eyebrow">Report summary</p>
                <p className="small text-2 mt-2" style={{ lineHeight: 1.6 }}>
                  {report.summaryText.split('\n').slice(1).join(' ')}
                </p>
              </div>
              <Award size={28} className="muted" />
            </div>
            <div className="report-mini-grid">
              <div>
                <span className="tiny muted">Most consistent week</span>
                <strong>{report.bestWeek?.label ?? '—'}</strong>
              </div>
              <div>
                <span className="tiny muted">Longest session</span>
                <strong>{report.longestSession ? `${Math.round(report.longestSession)} min` : '—'}</strong>
              </div>
              <div>
                <span className="tiny muted">Avg. session</span>
                <strong>{report.workouts ? `${Math.round(report.durationMin / report.workouts)} min` : '—'}</strong>
              </div>
            </div>
          </section>
        </>
      )}

      {tab === 'photos' && (
        <>
          <section className="card photo-journal-head">
            <div className="row" style={{ gap: 12 }}>
              <span className="entity-icon entity-icon-violet">
                <Camera />
              </span>
              <div className="grow">
                <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                  Photo journal
                </h2>
                <p className="tiny muted">
                  Front, side and freeform check-ins saved with your sessions. {photos.length} photo{photos.length === 1 ? '' : 's'} on this device.
                </p>
              </div>
              <Link to="/workouts" className="btn btn-sm btn-secondary">
                Start a session
              </Link>
            </div>
            <div className="scroll-x mt-3" style={{ paddingTop: 2 }}>
              <button type="button" className="chip chip-sm" data-active={poseFilter === 'all'} onClick={() => setPoseFilter('all')}>
                All
              </button>
              {(Object.keys(POSE_LABELS) as Array<SessionPhoto['pose']>).map((pose) => (
                <button key={pose} type="button" className="chip chip-sm" data-active={poseFilter === pose} onClick={() => setPoseFilter(pose)}>
                  {POSE_LABELS[pose]}
                </button>
              ))}
            </div>
          </section>

          {photos.length === 0 ? (
            <EmptyState
              icon={<ImageOff />}
              title="No check-in photos yet"
              text="During a session, add a front, side or freeform photo. They stay private in your local photo library."
              action={
                <Link to="/workouts" className="btn btn-primary">
                  Start a workout
                </Link>
              }
            />
          ) : (
            <>
              {pairs.some((pair) => pair.first && pair.last && pair.first.id !== pair.last.id) && (
                <section className="section">
                  <div className="section-head">
                    <h2 className="section-title">Then & now</h2>
                    <span className="badge badge-violet">Private comparison</span>
                  </div>
                  <div className="compare-grid">
                    {pairs.map((pair) =>
                      pair.first && pair.last && pair.first.id !== pair.last.id ? (
                        <div className="compare-card card" key={pair.pose}>
                          <div className="compare-head">
                            <span className="badge">{POSE_LABELS[pair.pose]}</span>
                            <span className="tiny muted">
                              {new Date(pair.first.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} →{' '}
                              {new Date(pair.last.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="compare-photos">
                            <PhotoThumb photoId={pair.first.id} alt={`${pair.pose} earlier`} />
                            <PhotoThumb photoId={pair.last.id} alt={`${pair.pose} now`} />
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </section>
              )}

              <section className="section">
                <div className="section-head">
                  <h2 className="section-title">All check-ins</h2>
                  <span className="badge">{filteredPhotos.length}</span>
                </div>
                {filteredPhotos.length === 0 ? (
                  <p className="small muted">No photos for this pose yet.</p>
                ) : (
                  <div className="photo-gallery">
                    {filteredPhotos.map((photo) => (
                      <button type="button" className="gallery-item" key={photo.id} onClick={() => setLightbox(photo)}>
                        <PhotoThumb
                          photoId={photo.id}
                          alt={`${POSE_LABELS[photo.pose]} photo`}
                          meta={
                            <>
                              <span>{new Date(photo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              <span>{POSE_LABELS[photo.pose]}</span>
                            </>
                          }
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}

      <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function Delta({ current, previous, unit }: { current: number; previous: number; unit: string }) {
  if (!previous) return <span className="tiny muted">No prior month</span>;
  const change = ((current - previous) / previous) * 100;
  const positive = change >= 0;
  return (
    <span className="stat-delta" data-negative={!positive} style={{ marginTop: 3 }}>
      {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(Math.round(change))}% vs last month{unit}
    </span>
  );
}

function Lightbox({ photo, onClose }: { photo: SessionPhoto | null; onClose: () => void }) {
  const url = usePhotoUrl(photo?.id);
  return (
    <Sheet open={Boolean(photo)} onClose={onClose} title={photo ? `${POSE_LABELS[photo.pose]} check-in` : undefined} subtitle={photo ? new Date(photo.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : undefined}>
      {photo && (
        <div className="lightbox-body">
          {url ? <img src={url} alt={`${POSE_LABELS[photo.pose]} progress photo`} /> : <div className="chart-empty">Loading photo…</div>}
          <div className="between mt-2">
            <span className="badge badge-violet">{POSE_LABELS[photo.pose]}</span>
            {photo.sessionId && (
              <Link to={`/history/${photo.sessionId}`} className="btn btn-sm btn-secondary" onClick={onClose}>
                <Dumbbell /> Open session
              </Link>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

interface HeatmapDay {
  date: string;
  workouts: number;
  level: number;
}

function buildHeatmap(sessions: Parameters<typeof weekStreak>[0], weeks: number): HeatmapDay[][] {
  const completed = sessions.filter((session) => session.status === 'completed');
  const counts = new Map<string, number>();
  for (const session of completed) {
    const date = sessionLocalDate(session);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  const currentWeek = startOfWeekKey(todayKey(), 1);
  return Array.from({ length: weeks }, (_, weekIndex) => {
    const weekStart = addDaysKey(currentWeek, -(weeks - 1 - weekIndex) * 7);
    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDaysKey(weekStart, dayIndex);
      const workouts = counts.get(date) ?? 0;
      const level = workouts === 0 ? 0 : workouts === 1 ? 1 : workouts === 2 ? 2 : 3;
      return { date, workouts, level };
    });
  });
}
