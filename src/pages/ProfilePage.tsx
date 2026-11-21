import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Camera,
  Check,
  ChevronRight,
  Download,
  Flame,
  HeartPulse,
  Image as ImageIcon,
  Info,
  Moon,
  Pencil,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Utensils,
  Weight,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { PhotoPicker } from '../components/ui/PhotoPicker';
import { Segmented } from '../components/ui/Segmented';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { Sheet } from '../components/ui/Sheet';
import { goalProgress } from '../lib/goals';
import { weekStreak } from '../lib/stats';
import { totalStats } from '../lib/stats';
import { nutritionTargets } from '../lib/nutrition';
import {
  cmToDisplay,
  displayToCm,
  displayToKg,
  formatHeight,
  formatVolume,
  formatWeight,
  formatWeightValue,
  weightUnit,
} from '../lib/units';
import { todayKey } from '../lib/date';
import type { ExperienceLevel, ExportBundle, FitnessGoal, Sex, ThemeMode, UnitSystem } from '../types';
import { toast } from '../store/toastStore';
import { clearPhotos } from '../lib/photoDb';

interface DraftProfile {
  name: string;
  bio: string;
  goal: FitnessGoal;
  experience: ExperienceLevel;
  sex: Sex | 'unspecified';
  birthYear: string;
  height: string;
  weight: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const settings = useAppStore((state) => state.settings);
  const sessions = useAppStore((state) => state.sessions);
  const bodyEntries = useAppStore((state) => state.bodyEntries);
  const goals = useAppStore((state) => state.goals);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const setProfilePhoto = useAppStore((state) => state.setProfilePhoto);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const updateNutritionTargets = useAppStore((state) => state.updateNutritionTargets);
  const exportBundle = useAppStore((state) => state.exportBundle);
  const importBundle = useAppStore((state) => state.importBundle);
  const resetToSeed = useAppStore((state) => state.resetToSeed);
  const loadDemoHistory = useAppStore((state) => state.loadDemoHistory);
  const removeSampleData = useAppStore((state) => state.removeSampleData);

  const [draft, setDraft] = useState<DraftProfile>({
    name: profile.name,
    bio: profile.bio ?? '',
    goal: profile.goal,
    experience: profile.experience,
    sex: profile.sex ?? 'unspecified',
    birthYear: profile.birthYear ? String(profile.birthYear) : '',
    height: profile.heightCm ? String(Number(cmToDisplay(profile.heightCm, profile.unitSystem).toFixed(1))) : '',
    weight: profile.weightKg ? formatWeightValue(profile.weightKg, profile.unitSystem, 1) : '',
  });
  const [targets, setTargets] = useState({
    calories: settings.nutrition.calories ? String(settings.nutrition.calories) : '',
    protein: settings.nutrition.protein ? String(settings.nutrition.protein) : '',
    carbs: settings.nutrition.carbs ? String(settings.nutrition.carbs) : '',
    fat: settings.nutrition.fat ? String(settings.nutrition.fat) : '',
  });
  const [resetOpen, setResetOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [removeSampleOpen, setRemoveSampleOpen] = useState(false);
  const [importConfirm, setImportConfirm] = useState<ExportBundle | null>(null);
  const [pendingImportName, setPendingImportName] = useState('');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => totalStats(sessions), [sessions]);
  const streak = weekStreak(sessions, settings.firstDayOfWeek);
  const estimated = nutritionTargets(profile, { ...settings, nutrition: {} });
  const completedGoals = goals.filter(
    (goal) => goal.completedAt || goalProgress(goal, { sessions, bodyEntries, profile }).done,
  ).length;
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const sampleSessions = sessions.filter((session) => session.isSample).length;

  const saveDraft = () => {
    if (!draft.name.trim()) {
      toast('Your profile needs a name.', 'error');
      return;
    }
    const heightValue = Number(draft.height.replace(',', '.'));
    const weightValue = Number(draft.weight.replace(',', '.'));
    const birthYear = Number(draft.birthYear);
    const heightCm = Number.isFinite(heightValue) && heightValue > 0 ? Math.round(displayToCm(heightValue, profile.unitSystem) * 10) / 10 : undefined;
    const weightKg = Number.isFinite(weightValue) && weightValue > 0 ? Math.round(displayToKg(weightValue, profile.unitSystem) * 10) / 10 : undefined;
    updateProfile({
      name: draft.name.trim(),
      bio: draft.bio.trim() || undefined,
      goal: draft.goal,
      experience: draft.experience,
      sex: draft.sex === 'unspecified' ? undefined : draft.sex,
      birthYear: Number.isFinite(birthYear) && birthYear > 1900 ? birthYear : undefined,
      heightCm,
      weightKg,
    });
    toast('Profile updated.', 'success');
  };

  const changeUnits = (next: UnitSystem) => {
    if (next === profile.unitSystem) return;
    const heightValue = Number(draft.height.replace(',', '.'));
    const weightValue = Number(draft.weight.replace(',', '.'));
    const heightCm = Number.isFinite(heightValue) && heightValue > 0 ? displayToCm(heightValue, profile.unitSystem) : profile.heightCm;
    const weightKg = Number.isFinite(weightValue) && weightValue > 0 ? displayToKg(weightValue, profile.unitSystem) : profile.weightKg;
    setDraft((current) => ({
      ...current,
      height: heightCm ? String(Number(cmToDisplay(heightCm, next).toFixed(1))) : '',
      weight: weightKg ? formatWeightValue(weightKg, next, 1) : '',
    }));
    updateProfile({ unitSystem: next });
    toast(`Units switched to ${next === 'imperial' ? 'imperial' : 'metric'}.`, 'success');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const bundle = await exportBundle();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `form-backup-${todayKey()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast('Backup downloaded.', 'success');
    } catch {
      toast('Could not create the backup.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ExportBundle;
      if (!parsed || (parsed.app !== 'form-fitness' && parsed.app !== 'form') || !parsed.state?.profile) {
        toast('That file is not a Form Fitness backup.', 'error');
        return;
      }
      setPendingImportName(file.name);
      setImportConfirm(parsed);
    } catch {
      toast('Could not read that backup file.', 'error');
    }
  };

  const saveTargets = () => {
    const parse = (value: string) => {
      const number = Number(value);
      return value.trim() && Number.isFinite(number) && number > 0 ? Math.round(number) : undefined;
    };
    updateNutritionTargets({
      calories: parse(targets.calories),
      protein: parse(targets.protein),
      carbs: parse(targets.carbs),
      fat: parse(targets.fat),
    });
    toast('Nutrition targets updated.', 'success');
  };

  const resetTargets = () => {
    updateNutritionTargets({ calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
    setTargets({ calories: '', protein: '', carbs: '', fat: '' });
    toast('Targets reset to the estimated values.', 'success');
  };

  return (
    <div className="page-enter profile-page">
      <PageHeader
        eyebrow="You"
        title="Profile & settings"
        subtitle="Your local profile. No account, no sign-in, and your data stays on this device unless you export it."
        actions={
          <button type="button" className="icon-btn icon-btn-bordered" onClick={() => setAboutOpen(true)} aria-label="About Form Fitness">
            <Info />
          </button>
        }
      />

      <section className="card profile-hero">
        <div className="profile-hero-main">
          <PhotoPicker
            ariaLabel="Upload profile photo"
            maxDimension={512}
            quality={0.85}
            onPick={(dataUrl) => {
              setProfilePhoto(dataUrl);
              toast('Profile photo updated.', 'success');
            }}
          >
            <span className="avatar-upload">
              <Avatar name={profile.name} src={profile.avatarUrl} size={84} ring />
              <span className="avatar-edit">
                <Camera />
              </span>
            </span>
          </PhotoPicker>
          <div className="grow">
            <div className="row" style={{ gap: 7 }}>
              <h2 className="profile-name">{profile.name}</h2>
              <span className="badge badge-lime">Local profile</span>
            </div>
            <p className="small muted" style={{ marginTop: 3 }}>
              {profile.bio || 'Add a line about what you’re training for.'}
            </p>
            <div className="profile-tags">
              <span className="muscle-tag">
                <Sparkles size={11} /> {profile.goal.replace('build', 'build muscle').replace('lose', 'lose fat')}
              </span>
              <span className="muscle-tag">
                <Activity size={11} /> {profile.experience}
              </span>
              <span className="muscle-tag">
                <Shield size={11} /> {memberSince}
              </span>
              {profile.avatarUrl && (
                <button type="button" className="profile-remove-photo" onClick={() => setProfilePhoto(undefined)}>
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="profile-stats">
          <div>
            <span className="stat-value">{stats.workouts}</span>
            <span className="stat-label">workouts</span>
          </div>
          <div>
            <span className="stat-value">{formatVolume(stats.volumeKg, profile.unitSystem)}</span>
            <span className="stat-label">volume</span>
          </div>
          <div>
            <span className="stat-value">{streak.weeks}<small>w</small></span>
            <span className="stat-label">streak</span>
          </div>
          <div>
            <span className="stat-value">{stats.prs.length}</span>
            <span className="stat-label">lifts tracked</span>
          </div>
          <div>
            <span className="stat-value">{completedGoals}</span>
            <span className="stat-label">goals hit</span>
          </div>
        </div>
      </section>

      <div className="profile-layout">
        <div className="stack">
          <section className="card">
            <div className="section-head" style={{ marginBottom: 14 }}>
              <div>
                <p className="eyebrow">Personal details</p>
                <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                  About you
                </h2>
              </div>
              <span className="badge">
                <Pencil size={11} /> Editable
              </span>
            </div>
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="profile-name">
                  Name
                </label>
                <input
                  id="profile-name"
                  className="input"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="profile-bio">
                  Bio <span className="muted">(optional)</span>
                </label>
                <textarea
                  id="profile-bio"
                  className="textarea"
                  rows={2}
                  value={draft.bio}
                  onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                  placeholder="What are you working toward?"
                />
              </div>
              <div className="inline-fields">
                <div className="field">
                  <label className="field-label" htmlFor="profile-goal">
                    Primary goal
                  </label>
                  <select
                    id="profile-goal"
                    className="select"
                    value={draft.goal}
                    onChange={(event) => setDraft({ ...draft, goal: event.target.value as FitnessGoal })}
                  >
                    <option value="build">Build muscle</option>
                    <option value="lose">Lose fat</option>
                    <option value="strength">Get stronger</option>
                    <option value="consistency">Stay consistent</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="profile-experience">
                    Experience
                  </label>
                  <select
                    id="profile-experience"
                    className="select"
                    value={draft.experience}
                    onChange={(event) => setDraft({ ...draft, experience: event.target.value as ExperienceLevel })}
                  >
                    <option value="new">New to lifting</option>
                    <option value="returning">Returning</option>
                    <option value="experienced">Experienced</option>
                  </select>
                </div>
              </div>
              <div className="inline-fields">
                <div className="field">
                  <label className="field-label" htmlFor="profile-sex">
                    Sex <span className="muted">(for estimates)</span>
                  </label>
                  <select
                    id="profile-sex"
                    className="select"
                    value={draft.sex}
                    onChange={(event) => setDraft({ ...draft, sex: event.target.value as Sex | 'unspecified' })}
                  >
                    <option value="unspecified">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="profile-birthyear">
                    Birth year
                  </label>
                  <input
                    id="profile-birthyear"
                    className="input"
                    inputMode="numeric"
                    value={draft.birthYear}
                    onChange={(event) => setDraft({ ...draft, birthYear: event.target.value.replace(/[^\d]/g, '').slice(0, 4) })}
                    placeholder="1994"
                  />
                </div>
              </div>
              <div className="inline-fields">
                <div className="field">
                  <label className="field-label" htmlFor="profile-height">
                    Height
                  </label>
                  <div className="input-group">
                    <input
                      id="profile-height"
                      className="input"
                      inputMode="decimal"
                      value={draft.height}
                      onChange={(event) => setDraft({ ...draft, height: event.target.value.replace(/[^\d.,]/g, '') })}
                      placeholder={profile.unitSystem === 'metric' ? '178' : '70'}
                    />
                    <span className="input-suffix">{profile.unitSystem === 'metric' ? 'cm' : 'in'}</span>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="profile-weight">
                    Bodyweight
                  </label>
                  <div className="input-group">
                    <input
                      id="profile-weight"
                      className="input"
                      inputMode="decimal"
                      value={draft.weight}
                      onChange={(event) => setDraft({ ...draft, weight: event.target.value.replace(/[^\d.,]/g, '') })}
                      placeholder={profile.unitSystem === 'metric' ? '78' : '172'}
                    />
                    <span className="input-suffix">{weightUnit(profile.unitSystem)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="between mt-3">
              <span className="tiny muted">
                {draft.height ? formatHeight(displayToCm(Number(draft.height) || 0, profile.unitSystem), profile.unitSystem) : 'No height set'} ·{' '}
                {draft.weight ? formatWeight(displayToKg(Number(draft.weight) || 0, profile.unitSystem), profile.unitSystem) : 'No weight set'}
              </span>
              <button type="button" className="btn btn-primary btn-sm" onClick={saveDraft}>
                <Check /> Save details
              </button>
            </div>
          </section>

          <section className="card">
            <div className="section-head" style={{ marginBottom: 8 }}>
              <div>
                <p className="eyebrow">Preferences</p>
                <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                  Training
                </h2>
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-row-main">
                <p className="setting-row-title">Weekly target</p>
                <p className="setting-row-desc">How many sessions make a good week?</p>
              </div>
              <div className="weekly-target">
                {[2, 3, 4, 5, 6, 7].map((target) => (
                  <button
                    key={target}
                    type="button"
                    className="rating-button"
                    data-active={profile.weeklyTarget === target}
                    onClick={() => updateProfile({ weeklyTarget: target })}
                    aria-label={`${target} sessions per week`}
                  >
                    {target}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-row-main">
                <p className="setting-row-title">Units</p>
                <p className="setting-row-desc">Used for weights, height and volume.</p>
              </div>
              <Segmented
                options={[
                  { value: 'metric', label: 'Metric' },
                  { value: 'imperial', label: 'Imperial' },
                ]}
                value={profile.unitSystem}
                onChange={(value) => changeUnits(value as UnitSystem)}
                ariaLabel="Unit system"
                className="segmented-inline"
              />
            </div>
            <div className="setting-row">
              <div className="setting-row-main">
                <p className="setting-row-title">Default rest timer</p>
                <p className="setting-row-desc">Used when an exercise has no custom rest.</p>
              </div>
              <div className="rest-choice">
                {[60, 90, 120, 180].map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    className="chip chip-sm"
                    data-active={settings.defaultRestSec === seconds}
                    onClick={() => updateSettings({ defaultRestSec: seconds })}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-row-main">
                <p className="setting-row-title">Auto-start rest timer</p>
                <p className="setting-row-desc">Begin counting down when you complete a set.</p>
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={settings.autoRest}
                aria-label="Auto-start rest timer"
                onClick={() => updateSettings({ autoRest: !settings.autoRest })}
              />
            </div>
            <div className="setting-row">
              <div className="setting-row-main">
                <p className="setting-row-title">Record RPE</p>
                <p className="setting-row-desc">Show an effort field in set options.</p>
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={settings.showRPE}
                aria-label="Show RPE"
                onClick={() => updateSettings({ showRPE: !settings.showRPE })}
              />
            </div>
            <div className="setting-row">
              <div className="setting-row-main">
                <p className="setting-row-title">Haptics</p>
                <p className="setting-row-desc">Vibrate when the rest timer finishes, where supported.</p>
              </div>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={settings.hapticFeedback}
                aria-label="Haptic feedback"
                onClick={() => updateSettings({ hapticFeedback: !settings.hapticFeedback })}
              />
            </div>
            <div className="setting-row">
              <div className="setting-row-main">
                <p className="setting-row-title">Week starts on</p>
                <p className="setting-row-desc">Affects weekly stats, streaks and the calendar.</p>
              </div>
              <Segmented
                options={[
                  { value: '0', label: 'Sunday' },
                  { value: '1', label: 'Monday' },
                ]}
                value={String(settings.firstDayOfWeek)}
                onChange={(value) => updateSettings({ firstDayOfWeek: value === '0' ? 0 : 1 })}
                ariaLabel="First day of week"
                className="segmented-inline"
              />
            </div>
          </section>

          <section className="card">
            <div className="between" style={{ marginBottom: 10 }}>
              <div>
                <p className="eyebrow">Appearance</p>
                <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                  Theme
                </h2>
              </div>
              <Segmented
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'system', label: 'System' },
                ]}
                value={settings.theme}
                onChange={(value) => updateSettings({ theme: value as ThemeMode })}
                ariaLabel="Theme"
                className="segmented-inline"
              />
            </div>
            <p className="tiny muted">Form Fitness is designed dark-first, with a light mode for daylight.</p>
          </section>

          <section className="card">
            <div className="between" style={{ marginBottom: 6 }}>
              <div>
                <p className="eyebrow">Nutrition</p>
                <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                  Daily targets
                </h2>
              </div>
              <span className="badge">{settings.nutrition.calories ? 'Custom' : 'Estimated'}</span>
            </div>
            <p className="tiny muted">
              Estimated base: <b>{estimated.calories} kcal</b> · <b>{estimated.protein}g protein</b> · {estimated.carbs}g carbs ·{' '}
              {estimated.fat}g fat. Override any value if you follow a plan.
            </p>
            <div className="form-grid mt-3">
              <div className="inline-fields" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[
                  { key: 'calories', label: 'Calories', placeholder: String(estimated.calories) },
                  { key: 'protein', label: 'Protein', placeholder: String(estimated.protein) },
                  { key: 'carbs', label: 'Carbs', placeholder: String(estimated.carbs) },
                  { key: 'fat', label: 'Fat', placeholder: String(estimated.fat) },
                ].map((field) => (
                  <div className="field" key={field.key}>
                    <label className="field-label" htmlFor={`target-${field.key}`}>
                      {field.label}
                    </label>
                    <input
                      id={`target-${field.key}`}
                      className="input"
                      inputMode="numeric"
                      value={targets[field.key as keyof typeof targets]}
                      onChange={(event) =>
                        setTargets({ ...targets, [field.key]: event.target.value.replace(/[^\d]/g, '') })
                      }
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="row mt-3" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={resetTargets}>
                Reset to auto
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={saveTargets}>
                Save targets
              </button>
            </div>
          </section>
        </div>

        <aside className="stack">
          <section className="card">
            <div className="between" style={{ marginBottom: 10 }}>
              <div>
                <p className="eyebrow">Your data</p>
                <h2 className="section-title" style={{ fontSize: '1.05rem' }}>
                  Local & private
                </h2>
              </div>
              <Shield size={18} className="mint" />
            </div>
            <p className="tiny muted" style={{ lineHeight: 1.55 }}>
              Your profile, programmes and photos live in this browser (local storage and private IndexedDB). No Form Fitness
              server receives them. Export a backup before clearing browser data.
            </p>
            <div className="stack-sm mt-3">
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport} disabled={exporting}>
                <Download /> {exporting ? 'Preparing backup…' : 'Export backup (JSON)'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload /> Import a backup
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void handleImportFile(file);
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDemoOpen(true)}
                disabled={sessions.some((session) => session.status === 'completed')}
                title={
                  sessions.some((session) => session.status === 'completed')
                    ? 'Sample history is only available before you have logged real workouts.'
                    : 'Add five weeks of sample training history to explore reports.'
                }
              >
                <Sparkles /> Add sample history
              </button>
              {sampleSessions > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRemoveSampleOpen(true)}>
                  <Trash2 /> Remove {sampleSessions} sample sessions
                </button>
              )}
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setResetOpen(true)}>
                <RotateCcw /> Reset all data
              </button>
            </div>
            <p className="tiny muted mt-3">
              {sessions.filter((session) => session.status === 'completed').length} workouts · {bodyEntries.length} check-ins ·{' '}
              {goals.length} goals
            </p>
            {sampleSessions > 0 && (
              <div className="info-note warn-note mt-3">
                <Sparkles />
                <span>
                  {sampleSessions} sample sessions and their check-ins are clearly tagged in History. Remove them any time
                  without touching real data.
                </span>
              </div>
            )}
          </section>

          <section className="card">
            <p className="eyebrow">Progress at a glance</p>
            <div className="profile-mini-stats">
              <div>
                <span className="stat-value">
                  <Flame size={17} /> {streak.weeks}
                </span>
                <span className="stat-label">week streak</span>
              </div>
              <div>
                <span className="stat-value">{stats.sets}</span>
                <span className="stat-label">working sets</span>
              </div>
              <div>
                <span className="stat-value">{Math.round(stats.minutes / 60)}<small>h</small></span>
                <span className="stat-label">trained</span>
              </div>
            </div>
            <div className="stack-sm mt-3">
              <button type="button" className="btn btn-sm btn-secondary btn-block" onClick={() => navigate('/progress')}>
                <TrendingUp /> Open progress report
              </button>
              <button type="button" className="btn btn-sm btn-ghost btn-block" onClick={() => navigate('/diary')}>
                <HeartPulse /> Daily diary
              </button>
            </div>
          </section>

          <section className="card">
            <p className="eyebrow">About Form Fitness</p>
            <p className="small mt-2" style={{ lineHeight: 1.55 }}>
              A focused, local-first training companion. Built for the gym floor: fast set logging, honest context and
              no account between you and the first rep.
            </p>
            <div className="about-rows">
              <span>
                <Utensils size={14} /> Nutrition diary
              </span>
              <span>
                <Weight size={14} /> Body diary
              </span>
              <span>
                <ImageIcon size={14} /> Photo journal
              </span>
              <span>
                <Moon size={14} /> Recovery check-ins
              </span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={() => setAboutOpen(true)}>
              Version & credits <ChevronRight size={14} />
            </button>
          </section>
        </aside>
      </div>

      <ConfirmSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset everything?"
        message="This removes your programmes, workouts, photos, food diary, check-ins and goals, then starts fresh with the example profile and programme. Export a backup first if you want to keep anything."
        confirmLabel="Reset all data"
        danger
        onConfirm={() => {
          void (async () => {
            await resetToSeed();
            await clearPhotos();
            toast('Form Fitness reset. Fresh start.', 'success');
            navigate('/');
          })();
        }}
      />

      <ConfirmSheet
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title="Add sample history?"
        message="Form Fitness will add five weeks of completed workouts and body check-ins, tagged as sample data, so you can explore charts, reports and streaks. Your existing data stays. Remove them any time from this page."
        confirmLabel="Add sample history"
        onConfirm={() => {
          loadDemoHistory();
          toast('Sample history added. Explore Progress and the calendar.', 'success');
        }}
      />

      <ConfirmSheet
        open={removeSampleOpen}
        onClose={() => setRemoveSampleOpen(false)}
        title="Remove sample history?"
        message="All tagged sample sessions and sample check-ins will be removed. Workouts you logged yourself, your goals and your programmes stay."
        confirmLabel="Remove sample data"
        danger
        onConfirm={() => {
          removeSampleData();
          toast('Sample history removed.', 'success');
        }}
      />

      <ConfirmSheet
        open={Boolean(importConfirm)}
        onClose={() => setImportConfirm(null)}
        title="Import this backup?"
        message={`“${pendingImportName}” will replace everything currently on this device. Make sure you have exported a backup of your current data first.`}
        confirmLabel="Replace with backup"
        danger
        onConfirm={() => {
          if (!importConfirm) return;
          void (async () => {
            try {
              await importBundle(importConfirm);
              toast('Backup imported.', 'success');
              setImportConfirm(null);
              navigate('/');
            } catch (error) {
              toast(error instanceof Error ? error.message : 'Could not import that backup.', 'error');
            }
          })();
        }}
      />

      <Sheet open={aboutOpen} onClose={() => setAboutOpen(false)} title="About Form Fitness" subtitle="Version 1.0 · local-first preview">
        <div className="about-sheet">
          <span className="brand-mark" style={{ width: 44, height: 44, borderRadius: 14 }}>
            <svg viewBox="0 0 512 512" width={26} height={26} aria-hidden="true">
              <path d="M150 124h232v70H230v54h128v68H230v108h-80V124z" fill="currentColor" />
            </svg>
          </span>
          <p className="strong">Train with intent.</p>
          <p className="small muted">
            Form Fitness is a complete first release built around programming and logging. It runs entirely in your browser and
            persists locally. There is no online account, feed or leaderboard in this build — and no fake social proof.
          </p>
          <div className="about-list">
            <div>
              <Check /> Programme builder & exercise library
            </div>
            <div>
              <Check /> Drag-and-drop recurring calendar
            </div>
            <div>
              <Check /> Set logging, rest timer, PRs and reports
            </div>
            <div>
              <Check /> Nutrition, body diary and progress photos
            </div>
            <div>
              <Check /> Local persistence, export & import
            </div>
          </div>
          <p className="tiny muted">
            Product and UI are original. The example 5-day programme comes from the supplied reference pack. No proprietary
            MYBOD branding or assets are used.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
