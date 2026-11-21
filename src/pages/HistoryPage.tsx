import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Dumbbell, History, Star, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Segmented } from '../components/ui/Segmented';
import { addDaysKey, dateKey, todayKey } from '../lib/date';
import { newPRsInSession, sessionDurationMinutes, sessionVolumeKg } from '../lib/workout';
import { formatDuration, formatVolume } from '../lib/units';

type Period = 'all' | 'month' | '30';

export function HistoryPage() {
  const sessions = useAppStore((state) => state.sessions);
  const profile = useAppStore((state) => state.profile);
  const [period, setPeriod] = useState<Period>('all');

  const completed = useMemo(
    () =>
      sessions
        .filter((session) => session.status === 'completed')
        .slice()
        .sort((a, b) => new Date(b.completedAt ?? b.startedAt).getTime() - new Date(a.completedAt ?? a.startedAt).getTime()),
    [sessions],
  );

  const filtered = useMemo(() => {
    const today = todayKey();
    if (period === '30') return completed.filter((session) => dateKey(new Date(session.completedAt ?? session.startedAt)) >= addDaysKey(today, -30));
    if (period === 'month') {
      const now = new Date();
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return completed.filter((session) => dateKey(new Date(session.completedAt ?? session.startedAt)) >= start);
    }
    return completed;
  }, [completed, period]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    for (const session of filtered) {
      const date = new Date(session.completedAt ?? session.startedAt);
      const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const list = groups.get(key) ?? [];
      list.push(session);
      groups.set(key, list);
    }
    return [...groups.entries()];
  }, [filtered]);

  const lifetimeVolume = completed.reduce((sum, session) => sum + sessionVolumeKg(session), 0);

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Training log"
        title="History"
        subtitle="Every session, set and personal best — one honest record."
      />

      <div className="history-summary">
        <div className="card card-sm">
          <span className="stat-value">{completed.length}</span>
          <span className="stat-label">
            <Dumbbell /> Workouts
          </span>
        </div>
        <div className="card card-sm">
          <span className="stat-value">{formatVolume(lifetimeVolume, profile.unitSystem)}</span>
          <span className="stat-label">
            <TrendingUp /> Lifetime volume
          </span>
        </div>
        <div className="card card-sm">
          <span className="stat-value">
            {completed.length > 0
              ? Math.round(completed.reduce((sum, session) => sum + sessionDurationMinutes(session), 0) / completed.length)
              : 0}
            <small>m</small>
          </span>
          <span className="stat-label">
            <History /> Avg. session
          </span>
        </div>
      </div>

      <div className="history-toolbar">
        <Segmented
          options={[
            { value: 'all', label: 'All time' },
            { value: 'month', label: 'This month' },
            { value: '30', label: 'Last 30 days' },
          ]}
          value={period}
          onChange={setPeriod}
          ariaLabel="Filter history"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Dumbbell />}
          title={completed.length === 0 ? 'No workouts logged yet' : 'Nothing in this period'}
          text={
            completed.length === 0
              ? 'Finish your first workout and it will appear here with volume, sets and PRs.'
              : 'Try a wider date range or start a new session.'
          }
          action={
            <Link to="/workouts" className="btn btn-primary">
              Go to workouts
            </Link>
          }
        />
      ) : (
        <div className="history-groups">
          {grouped.map(([month, items]) => (
            <section key={month}>
              <div className="history-month">
                <h2 className="section-title" style={{ fontSize: '0.95rem' }}>
                  {month}
                </h2>
                <span className="tiny muted">{items.length} sessions</span>
              </div>
              <div className="stack-sm">
                {items.map((session) => {
                  const prs = newPRsInSession(session, sessions);
                  return (
                    <Link to={`/history/${session.id}`} key={session.id} className="history-card">
                      <div className="history-date">
                        <span>{new Date(session.completedAt ?? session.startedAt).getDate()}</span>
                        <small>{new Date(session.completedAt ?? session.startedAt).toLocaleDateString('en-US', { weekday: 'short' })}</small>
                      </div>
                      <div className="grow">
                        <div className="row" style={{ gap: 7 }}>
                          <p className="strong">{session.name}</p>
                          {prs.length > 0 && (
                            <span className="badge badge-gold">
                              <Star size={10} /> {prs.length} PR{prs.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {session.isSample && <span className="badge badge-sample">Sample</span>}
                        </div>
                        <p className="tiny muted" style={{ marginTop: 3 }}>
                          {formatVolume(sessionVolumeKg(session), profile.unitSystem)} · {formatDuration(sessionDurationMinutes(session) * 60)} ·{' '}
                          {session.exercises.length} exercises ·{' '}
                          {session.exercises.reduce(
                            (sum, exercise) => sum + exercise.sets.filter((set) => set.type !== 'warmup').length,
                            0,
                          )}{' '}
                          sets
                        </p>
                      </div>
                      <ChevronRight size={16} className="muted" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
