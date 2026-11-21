import { Suspense, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Apple,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  CircleUserRound,
  Dumbbell,
  Flame,
  House,
  Menu as MenuIcon,
  NotebookPen,
  Target,
  Users,
  Compass,
} from 'lucide-react';
import clsx from 'clsx';
import { useAppStore, getActiveSession } from '../store/appStore';
import { weekStreak } from '../lib/stats';
import { Avatar } from './ui/Avatar';
import { Brand } from './ui/Logo';
import { RestTimerDock } from './RestTimerDock';

const MAIN_NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/workouts', label: 'Train', icon: Dumbbell, active: ['/workouts', '/programs', '/library', '/session', '/history'] },
  { to: '/calendar', label: 'Plan', icon: CalendarDays, active: ['/calendar'] },
  { to: '/progress', label: 'Progress', icon: ChartNoAxesCombined, active: ['/progress'] },
  { to: '/more', label: 'More', icon: MenuIcon, active: ['/more', '/food', '/diary', '/goals', '/learn', '/profile', '/circle'] },
];

const SIDEBAR_GROUPS: Array<{
  label: string;
  items: Array<{ to: string; label: string; icon: typeof House; active?: string[]; end?: boolean }>;
}> = [
  {
    label: 'Training',
    items: [
      { to: '/', label: 'Home', icon: House, end: true },
      { to: '/workouts', label: 'Workouts', icon: Dumbbell, active: ['/workouts', '/programs', '/session', '/history'] },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays, active: ['/calendar'] },
      { to: '/library', label: 'Exercise library', icon: Compass, active: ['/library'] },
      { to: '/progress', label: 'Progress & reports', icon: ChartNoAxesCombined, active: ['/progress'] },
    ],
  },
  {
    label: 'Fuel & life',
    items: [
      { to: '/food', label: 'Nutrition', icon: Apple, active: ['/food'] },
      { to: '/diary', label: 'Daily diary', icon: NotebookPen, active: ['/diary'] },
      { to: '/goals', label: 'Goals & badges', icon: Target, active: ['/goals'] },
      { to: '/learn', label: 'Learn', icon: BookOpen, active: ['/learn'] },
    ],
  },
  {
    label: 'You',
    items: [
      { to: '/circle', label: 'Training circle', icon: Users, active: ['/circle'] },
      { to: '/profile', label: 'Profile & settings', icon: CircleUserRound, active: ['/profile'] },
    ],
  },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function useNavActive() {
  const { pathname } = useLocation();
  return (item: { to: string; end?: boolean; active?: string[] }) => {
    if (item.end) return pathname === item.to;
    if (item.active) return item.active.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  };
}

export function AppShell() {
  const { pathname } = useLocation();
  const focusMode = pathname.startsWith('/session/');
  const profile = useAppStore((state) => state.profile);
  const settings = useAppStore((state) => state.settings);
  const sessions = useAppStore((state) => state.sessions);
  const activeSession = useAppStore((state) => getActiveSession(state));
  const streak = weekStreak(sessions, settings.firstDayOfWeek);
  const isActive = useNavActive();

  return (
    <div className="app-shell" data-focus={focusMode}>
      <ScrollToTop />
      <aside className="sidebar" aria-label="Primary navigation">
        <NavLink to="/" aria-label="FORM home">
          <Brand />
        </NavLink>
        <nav className="sidebar-nav">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="sidebar-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className="side-link" data-active={isActive(item)}>
                    <Icon />
                    <span>{item.label}</span>
                    {item.to === '/workouts' && activeSession && <span className="nav-dot" style={{ position: 'static', marginLeft: 'auto' }} />}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/profile" className="sidebar-profile">
            <Avatar name={profile.name} src={profile.avatarUrl} size={38} />
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="list-title truncate" style={{ display: 'block', fontSize: '0.82rem' }}>
                {profile.name}
              </span>
              <span className="list-sub">Local profile · private</span>
            </span>
          </NavLink>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <NavLink to="/" aria-label="FORM home">
            <Brand />
          </NavLink>
          <div className="topbar-actions">
            <span className="streak-chip" title="Weekly training streak">
              <Flame size={14} />
              {streak.weeks}w
            </span>
            <NavLink to="/profile" aria-label="Open profile">
              <Avatar name={profile.name} src={profile.avatarUrl} size={34} />
            </NavLink>
          </div>
        </header>

        <main className="container">
          <Suspense
            fallback={
              <div className="page-enter" style={{ paddingTop: 26 }} aria-busy="true" aria-label="Loading page">
                <div className="skeleton" style={{ height: 26, width: '42%' }} />
                <div className="skeleton" style={{ height: 15, width: '64%', marginTop: 12 }} />
                <div className="skeleton" style={{ height: 210, marginTop: 24, borderRadius: 22 }} />
                <div className="skeleton" style={{ height: 120, marginTop: 12, borderRadius: 18 }} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {MAIN_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <NavLink key={item.to} to={item.to} className={clsx('nav-item')} data-active={active}>
              <Icon />
              <span>{item.label}</span>
              {item.to === '/workouts' && activeSession && <span className="nav-dot" />}
            </NavLink>
          );
        })}
      </nav>

      <RestTimerDock />
    </div>
  );
}
