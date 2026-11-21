import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clipboard,
  Copy,
  Dumbbell,
  Flame,
  Info,
  Lock,
  MessageCircle,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { ProgressRing } from '../components/ui/ProgressRing';
import { weekStreak, weeklySeries, workoutsThisWeek } from '../lib/stats';
import { formatDuration, formatVolume } from '../lib/units';
import { sessionDurationMinutes, sessionVolumeKg } from '../lib/workout';

export function CirclePage() {
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);
  const settings = useAppStore((state) => state.settings);
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const completed = useMemo(
    () =>
      sessions
        .filter((session) => session.status === 'completed')
        .sort((a, b) => new Date(b.completedAt ?? b.startedAt).getTime() - new Date(a.completedAt ?? a.startedAt).getTime()),
    [sessions],
  );
  const latest = completed[0];
  const workouts = workoutsThisWeek(sessions, settings.firstDayOfWeek);
  const streak = weekStreak(sessions, settings.firstDayOfWeek);
  const series = weeklySeries(sessions, 2, settings.firstDayOfWeek);
  const thisWeekVolume = series[series.length - 1]?.volumeKg ?? 0;
  const lastWeekVolume = series[0]?.volumeKg ?? 0;
  const challengeProgress = lastWeekVolume > 0 ? Math.min(1, thisWeekVolume / lastWeekVolume) : thisWeekVolume > 0 ? 1 : 0;
  const challengeActive = lastWeekVolume > 0;

  const copySummary = async () => {
    const text = latest
      ? `Form Fitness — ${latest.name}\n${new Date(latest.completedAt ?? latest.startedAt).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}\n${formatVolume(sessionVolumeKg(latest), profile.unitSystem)} · ${formatDuration(
          sessionDurationMinutes(latest) * 60,
        )} · ${latest.exercises.length} exercises\n${latest.exercises
          .map((exercise) => `• ${exercise.sets.filter((set) => set.type !== 'warmup').length} working sets`)
          .slice(0, 6)
          .join('\n')}`
      : 'Form Fitness — no sessions logged yet.';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Circle"
        title="Training circle"
        subtitle="Community, without the performance. A local-first take on training alongside other people."
        back="/more"
        actions={
          <button type="button" className="btn btn-secondary btn-sm" onClick={copySummary}>
            {copied ? <Check size={14} /> : <Copy />} {copied ? 'Copied' : 'Copy session'}
          </button>
        }
      />

      <section className="circle-hero card">
        <div className="circle-orbit" aria-hidden="true">
          <span className="circle-dot circle-dot-1" />
          <span className="circle-dot circle-dot-2" />
          <span className="circle-dot circle-dot-3" />
          <span className="circle-core">
            <Dumbbell />
          </span>
        </div>
        <div className="grow">
          <span className="badge badge-violet">
            <Lock size={11} /> Local-only preview
          </span>
          <h2 className="circle-title">Your data doesn’t need an audience.</h2>
          <p className="small muted">
            There is no account, feed or global leaderboard in this build — and Form Fitness won’t invent one. What you can do
            today is train consistently, keep your record private, and share a clean summary when you choose to.
          </p>
          <div className="hero-actions">
            <Link to="/progress" className="btn btn-primary btn-sm">
              <Trophy /> Your progress
            </Link>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRoadmapOpen(true)}>
              <Info /> How social would work
            </button>
          </div>
        </div>
      </section>

      <div className="circle-grid">
        <section className="card">
          <div className="between" style={{ marginBottom: 12 }}>
            <div>
              <p className="eyebrow">This week, solo</p>
              <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                Consistency is the flex
              </h2>
            </div>
            <span className="badge badge-lime">{streak.weeks}w streak</span>
          </div>
          <div className="row" style={{ gap: 16 }}>
            <ProgressRing
              value={profile.weeklyTarget > 0 ? workouts / profile.weeklyTarget : 0}
              size={78}
              stroke={7}
              number={`${workouts}`}
              label={`of ${profile.weeklyTarget}`}
              ariaLabel="Weekly target progress"
            />
            <div className="grow">
              <p className="small strong">{workouts} of {profile.weeklyTarget} sessions</p>
              <p className="tiny muted">
                {workouts >= profile.weeklyTarget ? 'Weekly target hit. Recover well.' : `${profile.weeklyTarget - workouts} more to hit the week.`}
              </p>
              <div className="streak-inline" style={{ marginTop: 8 }}>
                <Flame size={14} /> {streak.weeks} weeks in a row
              </div>
            </div>
          </div>
          <Link to="/calendar" className="btn btn-sm btn-secondary btn-block mt-3">
            Plan the rest of the week <ArrowRight size={14} />
          </Link>
        </section>

        <section className="card">
          <div className="between" style={{ marginBottom: 8 }}>
            <div>
              <p className="eyebrow">Local challenge</p>
              <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                Beat last week
              </h2>
            </div>
            <Sparkles size={17} className="lime" />
          </div>
          {challengeActive ? (
            <>
              <p className="tiny muted">
                Last week you moved {formatVolume(lastWeekVolume, profile.unitSystem)}. This week you’re at{' '}
                {formatVolume(thisWeekVolume, profile.unitSystem)}.
              </p>
              <div className="challenge-row mt-3">
                <span className="bar">
                  <span className="bar-fill" style={{ width: `${challengeProgress * 100}%` }} />
                </span>
                <span className="strong small">{Math.round(challengeProgress * 100)}%</span>
              </div>
              <p className="tiny muted mt-2">
                {challengeProgress >= 1
                  ? 'Challenge complete. You beat last week — quietly, just for you.'
                  : `${formatVolume(Math.max(0, lastWeekVolume - thisWeekVolume), profile.unitSystem)} to match last week.`}
              </p>
            </>
          ) : (
            <p className="small muted">
              Log a couple of sessions and Form Fitness will set a private weekly volume challenge from your own baseline.
            </p>
          )}
          {latest && (
            <div className="latest-session-mini">
              <span className="entity-icon entity-icon-lime">
                <Dumbbell />
              </span>
              <div className="grow">
                <p className="strong small">{latest.name}</p>
                <p className="tiny muted">
                  {new Date(latest.completedAt ?? latest.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                  {formatVolume(sessionVolumeKg(latest), profile.unitSystem)}
                </p>
              </div>
              <Link to={`/history/${latest.id}`} className="btn btn-xs btn-ghost">
                View
              </Link>
            </div>
          )}
        </section>

        <section className="card circle-people">
          <div className="between" style={{ marginBottom: 10 }}>
            <div>
              <p className="eyebrow">Your circle</p>
              <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                Training partners
              </h2>
            </div>
            <span className="badge">0</span>
          </div>
          <div className="circle-empty">
            <Users size={24} />
            <p className="small strong">No accounts, no fake friends.</p>
            <p className="tiny muted">
              Online circles need a backend and identity. This build deliberately ships without them rather than showing
              invented rankings. Your next session is the only comparison that matters today.
            </p>
          </div>
          <div className="stack-sm mt-3">
            <Link to="/workouts" className="btn btn-primary btn-sm btn-block">
              <Dumbbell /> Train now
            </Link>
            <button type="button" className="btn btn-secondary btn-sm btn-block" onClick={copySummary}>
              <Clipboard /> Copy a session summary to share
            </button>
          </div>
        </section>

        <section className="card">
          <div className="between" style={{ marginBottom: 10 }}>
            <div>
              <p className="eyebrow">What’s next</p>
              <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                A social layer with consent
              </h2>
            </div>
            <MessageCircle size={17} className="violet" />
          </div>
          <ul className="circle-roadmap">
            <li>
              <span className="circle-roadmap-dot" />
              Opt-in accounts with encrypted sync across devices.
            </li>
            <li>
              <span className="circle-roadmap-dot" />
              Private circles with invite links, not a global feed.
            </li>
            <li>
              <span className="circle-roadmap-dot" />
              Weekly consistency challenges with friends.
            </li>
            <li>
              <span className="circle-roadmap-dot" />
              Share cards generated locally — never your raw photos.
            </li>
          </ul>
          <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setRoadmapOpen(true)}>
            Read the design note <ArrowRight size={14} />
          </button>
        </section>
      </div>

      <Sheet
        open={roadmapOpen}
        onClose={() => setRoadmapOpen(false)}
        title="The community decision"
        subtitle="Why this local-first build has no leaderboard"
      >
        <div className="stack">
          <p className="small text-2" style={{ lineHeight: 1.6 }}>
            A real leaderboard requires a server, accounts, moderation and a privacy model. Showing a mocked one would be
            dishonest, and fake social proof is worse than no social proof. Form Fitness’s first release focuses on the part that
            compounds: your own training record.
          </p>
          <div className="info-note">
            <Share2 />
            <span>
              For now, you can copy a clean session or weekly summary and share it wherever you already talk to people.
              Photos never leave this device through Form Fitness.
            </span>
          </div>
          <p className="small text-2" style={{ lineHeight: 1.6 }}>
            If an online layer is added later, the plan is opt-in only: private circles, no global ranking by default,
            explicit sharing, and a data diet that does not require uploading body photos.
          </p>
          <button type="button" className="btn btn-secondary btn-block" onClick={copySummary}>
            <Clipboard /> Copy latest session summary
          </button>
        </div>
      </Sheet>
    </div>
  );
}
