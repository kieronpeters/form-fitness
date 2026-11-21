import { Link } from 'react-router-dom';
import {
  Apple,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircleUserRound,
  Compass,
  Dumbbell,
  NotebookPen,
  Shield,
  Target,
  Users,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { ProgressRing } from '../components/ui/ProgressRing';
import { weekStreak, workoutsThisWeek, volumeThisWeek } from '../lib/stats';
import { formatVolume } from '../lib/units';

const LINKS = [
  {
    to: '/food',
    title: 'Nutrition',
    description: 'Calories, macros, meals and saved meals.',
    icon: Apple,
    tone: 'coral',
  },
  {
    to: '/diary',
    title: 'Daily diary',
    description: 'Bodyweight, measurements, sleep and readiness.',
    icon: NotebookPen,
    tone: 'blue',
  },
  {
    to: '/goals',
    title: 'Goals & achievements',
    description: 'Targets, streaks and the badges behind them.',
    icon: Target,
    tone: 'gold',
  },
  {
    to: '/learn',
    title: 'Learn',
    description: 'Practical training, nutrition and recovery reads.',
    icon: BookOpen,
    tone: 'violet',
  },
  {
    to: '/calendar',
    title: 'Calendar & repeats',
    description: 'Plan the week and repeat your best structure.',
    icon: CalendarDays,
    tone: 'lime',
  },
  {
    to: '/library',
    title: 'Exercise library',
    description: 'Technique cues, muscles and alternatives.',
    icon: Compass,
    tone: 'blue',
  },
  {
    to: '/progress',
    title: 'Progress & reports',
    description: 'Volume, PRs, consistency and monthly reports.',
    icon: ChartNoAxesCombined,
    tone: 'lime',
  },
  {
    to: '/circle',
    title: 'Training circle',
    description: 'The local-first take on community and sharing.',
    icon: Users,
    tone: 'violet',
  },
];

const TONE_ICON: Record<string, string> = {
  lime: 'entity-icon-lime',
  coral: 'entity-icon-coral',
  blue: 'entity-icon-blue',
  violet: 'entity-icon-violet',
  gold: 'entity-icon-gold',
};

export function MorePage() {
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);
  const settings = useAppStore((state) => state.settings);
  const workouts = workoutsThisWeek(sessions, settings.firstDayOfWeek);
  const streak = weekStreak(sessions, settings.firstDayOfWeek);
  const volume = volumeThisWeek(sessions, settings.firstDayOfWeek);

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="More"
        title="Everything else"
        subtitle="The supporting cast around your training: food, recovery, goals and learning."
      />

      <Link to="/profile" className="card profile-strip card-interactive">
        <Avatar name={profile.name} src={profile.avatarUrl} size={52} ring />
        <div className="grow">
          <div className="row" style={{ gap: 6 }}>
            <p className="strong">{profile.name}</p>
            <span className="badge badge-lime">Local</span>
          </div>
          <p className="tiny muted">
            {profile.weeklyTarget} sessions / week · {profile.unitSystem === 'metric' ? 'metric' : 'imperial'} · {profile.goal.replace('build', 'build muscle')}
          </p>
        </div>
        <span className="btn btn-sm btn-secondary">
          Profile <ChevronRight size={14} />
        </span>
      </Link>

      <section className="more-week card">
        <div className="row" style={{ gap: 18 }}>
          <ProgressRing
            value={profile.weeklyTarget > 0 ? workouts / profile.weeklyTarget : 0}
            size={82}
            stroke={7}
            number={`${workouts}`}
            label={`of ${profile.weeklyTarget}`}
            ariaLabel={`${workouts} of ${profile.weeklyTarget} workouts this week`}
          />
          <div className="grow">
            <p className="eyebrow">This week</p>
            <p className="chart-value">{formatVolume(volume, profile.unitSystem)}</p>
            <p className="tiny muted">
              {streak.weeks} week streak · {settings.firstDayOfWeek === 1 ? 'Monday' : 'Sunday'} start
            </p>
          </div>
          <Link to="/progress" className="btn btn-sm btn-secondary">
            Progress <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <div className="more-grid">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link to={link.to} key={link.to} className="more-card card card-interactive">
              <span className={`entity-icon ${TONE_ICON[link.tone] ?? ''}`}>
                <Icon />
              </span>
              <div className="grow">
                <p className="strong small">{link.title}</p>
                <p className="tiny muted">{link.description}</p>
              </div>
              <ChevronRight size={16} className="muted" />
            </Link>
          );
        })}
      </div>

      <section className="section">
        <div className="card local-first-card">
          <div className="row" style={{ gap: 12 }}>
            <span className="entity-icon entity-icon-mint" style={{ background: 'var(--mint-soft)', color: 'var(--mint)' }}>
              <Shield />
            </span>
            <div className="grow">
              <p className="strong small">Private by design</p>
              <p className="tiny muted">
                No account, no cloud, no ad tracking. Export a JSON backup from Profile whenever you want a copy.
              </p>
            </div>
          </div>
          <div className="local-first-links">
            <Link to="/profile">
              <CircleUserRound size={15} /> Data & backup
            </Link>
            <Link to="/learn">
              <BookOpen size={15} /> How FORM works
            </Link>
            <Link to="/workouts">
              <Dumbbell size={15} /> Start training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
