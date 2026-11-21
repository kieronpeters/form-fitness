import { useMemo, useState } from 'react';
import {
  Award,
  Bolt,
  CalendarDays,
  Camera,
  Compass,
  Flag,
  Flame,
  Moon,
  Plus,
  Repeat,
  Sunrise,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Weight,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { ExercisePicker } from '../components/ExercisePicker';
import { ProgressRing } from '../components/ui/ProgressRing';
import type { Goal, GoalKind } from '../types';
import { evaluateAchievements } from '../lib/achievements';
import { goalDefaultTitle, goalKindLabel, goalProgress } from '../lib/goals';
import { getExercise } from '../data/exercises';
import { formatVolume, formatWeight, formatWeightValue, displayToKg, weightUnit } from '../lib/units';
import { createId } from '../lib/ids';
import { toast } from '../store/toastStore';

const ICONS: Record<string, typeof Flag> = {
  flag: Flag,
  flame: Flame,
  trophy: Trophy,
  repeat: Repeat,
  calendar: CalendarDays,
  weight: Weight,
  trending: TrendingUp,
  camera: Camera,
  target: Target,
  sunrise: Sunrise,
  moon: Moon,
  compass: Compass,
  bolt: Bolt,
};

const GOAL_KINDS: GoalKind[] = ['workouts', 'streak', 'volume', 'bodyweight', 'exercise', 'custom'];

export function GoalsPage() {
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);
  const bodyEntries = useAppStore((state) => state.bodyEntries);
  const goals = useAppStore((state) => state.goals);
  const photos = useAppStore((state) => state.sessionPhotos);
  const customExercises = useAppStore((state) => state.customExercises);
  const addGoal = useAppStore((state) => state.addGoal);
  const deleteGoal = useAppStore((state) => state.deleteGoal);
  const completeGoal = useAppStore((state) => state.completeGoal);
  const reopenGoal = useAppStore((state) => state.reopenGoal);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [form, setForm] = useState({
    kind: 'workouts' as GoalKind,
    title: '',
    target: '20',
    exerciseId: '',
    deadline: '',
    note: '',
    startWeight: formatWeightValue(profile.weightKg ?? 78, profile.unitSystem, 1),
    startLift: '',
  });

  const currentWeight = bodyEntries.slice().sort((a, b) => b.date.localeCompare(a.date)).find((entry) => entry.weightKg)?.weightKg ?? profile.weightKg ?? 78;
  const context = { sessions, bodyEntries, profile };
  const goalItems = useMemo(
    () =>
      goals
        .map((goal) => ({ goal, progress: goalProgress(goal, context) }))
        .sort((a, b) => {
          if (a.progress.done !== b.progress.done) return a.progress.done ? 1 : -1;
          return b.progress.percent - a.progress.percent;
        }),
    [goals, context],
  );
  const achievements = useMemo(
    () => evaluateAchievements({ sessions, photos, goals, bodyEntries, profile, customExercises }),
    [sessions, photos, goals, bodyEntries, profile, customExercises],
  );
  const unlocked = achievements.filter((achievement) => achievement.unlocked);
  const completedGoals = goalItems.filter((item) => item.progress.done).length;

  const resetForm = () => {
    setForm({
      kind: 'workouts',
      title: '',
      target: '20',
      exerciseId: '',
      deadline: '',
      note: '',
      startWeight: formatWeightValue(currentWeight, profile.unitSystem, 1),
      startLift: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const targetUnit = (kind: GoalKind) =>
    kind === 'bodyweight' || kind === 'exercise'
      ? weightUnit(profile.unitSystem)
      : kind === 'streak'
        ? 'weeks'
        : kind === 'volume'
          ? weightUnit(profile.unitSystem)
          : kind === 'workouts'
            ? 'workouts'
            : '';

  const handleCreate = () => {
    const targetValue = Number(form.target.replace(',', '.'));
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      toast('Set a target above zero.', 'error');
      return;
    }
    if (form.kind === 'exercise' && !form.exerciseId) {
      toast('Choose an exercise for this goal.', 'error');
      return;
    }
    const storedTarget =
      form.kind === 'bodyweight' || form.kind === 'exercise' || form.kind === 'volume'
        ? Math.round(displayToKg(targetValue, profile.unitSystem) * 10) / 10
        : Math.round(targetValue);
    const title =
      form.title.trim() ||
      goalDefaultTitle({ kind: form.kind, target: storedTarget, exerciseId: form.exerciseId || undefined }, profile.unitSystem);
    const startWeightValue = Number(form.startWeight.replace(',', '.'));
    const goal: Goal = {
      id: createId('goal'),
      title,
      kind: form.kind,
      target: storedTarget,
      startingValue:
        form.kind === 'bodyweight'
          ? Math.round(displayToKg(Number.isFinite(startWeightValue) && startWeightValue > 0 ? startWeightValue : currentWeight, profile.unitSystem) * 10) / 10
          : form.kind === 'exercise' && form.startLift
            ? Math.round(displayToKg(Number(form.startLift) || 0, profile.unitSystem) * 10) / 10
            : undefined,
      exerciseId: form.kind === 'exercise' ? form.exerciseId : undefined,
      unit: targetUnit(form.kind),
      deadline: form.deadline || undefined,
      createdAt: new Date().toISOString(),
      note: form.note.trim() || undefined,
    };
    addGoal(goal);
    setCreateOpen(false);
    toast('Goal created.', 'success');
  };

  const selectKind = (kind: GoalKind) => {
    const defaults: Record<GoalKind, string> = {
      workouts: '20',
      streak: '4',
      volume: profile.unitSystem === 'imperial' ? '100000' : '50000',
      bodyweight: formatWeightValue(Math.max(40, currentWeight - 4), profile.unitSystem, 1),
      exercise: '100',
      custom: '1',
    };
    setForm((current) => ({ ...current, kind, target: defaults[kind], title: '' }));
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Aim"
        title="Goals & achievements"
        subtitle="Targets that change behaviour, and badges that mark the work behind them."
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus /> New goal
          </button>
        }
      />

      <div className="goals-summary">
        <div className="card card-sm">
          <span className="stat-value">
            {completedGoals}
            <small>/{goals.length}</small>
          </span>
          <span className="stat-label">
            <Target /> Goals completed
          </span>
        </div>
        <div className="card card-sm">
          <span className="stat-value">{unlocked.length}</span>
          <span className="stat-label">
            <Award /> Badges unlocked
          </span>
        </div>
        <div className="card card-sm">
          <span className="stat-value">{achievements.length}</span>
          <span className="stat-label">
            <Trophy /> Badges to chase
          </span>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2 className="section-title">Your goals</h2>
          <span className="badge">{goals.length}</span>
        </div>
        {goalItems.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <Target />
            </div>
            <p className="empty-title">A target gives the work direction</p>
            <p className="empty-text">Start with a weekly workout count or a lift you want to hit.</p>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus /> Create a goal
            </button>
          </div>
        ) : (
          <div className="goal-grid">
            {goalItems.map(({ goal, progress }) => {
              const exercise = goal.exerciseId ? getExercise(goal.exerciseId, customExercises) : undefined;
              const headline =
                goal.kind === 'bodyweight'
                  ? `${formatWeight(progress.current, profile.unitSystem)} → ${formatWeight(progress.target, profile.unitSystem)}`
                  : goal.kind === 'exercise'
                    ? `${formatWeight(progress.current, profile.unitSystem)} best · target ${formatWeight(progress.target, profile.unitSystem)}`
                    : goal.kind === 'volume'
                      ? `${formatVolume(progress.current, profile.unitSystem)} of ${formatVolume(progress.target, profile.unitSystem)}`
                      : progress.headline;
              return (
                <article className="card goal-card" key={goal.id} data-done={progress.done}>
                  <div className="goal-card-head">
                    <ProgressRing
                      value={progress.percent / 100}
                      size={64}
                      stroke={6}
                      number={`${progress.percent}%`}
                      tone={progress.done ? 'var(--mint)' : 'var(--accent)'}
                      ariaLabel={`${goal.title} progress`}
                    />
                    <div className="grow">
                      <div className="row" style={{ gap: 6 }}>
                        <span className="badge">{goalKindLabel(goal.kind)}</span>
                        {progress.done && <span className="badge badge-mint">Done</span>}
                        {goal.deadline && !progress.done && (
                          <span className="badge">{Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000)}d left</span>
                        )}
                      </div>
                      <h3 className="goal-title">{goal.title}</h3>
                      <p className="tiny muted">
                        {exercise ? `${exercise.name} · ` : ''}
                        {headline}
                      </p>
                    </div>
                  </div>
                  <div className="bar mt-3">
                    <span
                      className="bar-fill"
                      data-tone={progress.done ? 'mint' : undefined}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <div className="goal-card-foot">
                    <span className="tiny muted">{progress.detail}</span>
                    <div className="row" style={{ gap: 4 }}>
                      {goal.kind === 'custom' && (
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary"
                          onClick={() => {
                            if (progress.done) reopenGoal(goal.id);
                            else completeGoal(goal.id);
                          }}
                        >
                          {progress.done ? 'Reopen' : 'Mark done'}
                        </button>
                      )}
                      <button type="button" className="icon-btn icon-btn-sm" onClick={() => setDeleteTarget(goal)} aria-label="Delete goal">
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-head">
          <h2 className="section-title">Achievements</h2>
          <span className="badge badge-lime">
            {unlocked.length}/{achievements.length}
          </span>
        </div>
        <div className="achievement-grid">
          {achievements
            .slice()
            .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.current / b.target - a.current / a.target)
            .map((achievement) => {
              const Icon = ICONS[achievement.icon] ?? Award;
              return (
                <article
                  className="achievement-card"
                  key={achievement.id}
                  data-unlocked={achievement.unlocked}
                  data-tone={achievement.tone}
                >
                  <span className="achievement-icon">
                    <Icon />
                  </span>
                  <div className="grow">
                    <div className="row" style={{ gap: 6 }}>
                      <p className="strong small">{achievement.title}</p>
                      {achievement.unlocked && <span className="badge badge-mint">Unlocked</span>}
                    </div>
                    <p className="tiny muted">{achievement.description}</p>
                    {!achievement.unlocked && (
                      <div className="achievement-progress">
                        <span className="bar">
                          <span className="bar-fill" style={{ width: `${Math.min(100, (achievement.current / achievement.target) * 100)}%` }} />
                        </span>
                        <span className="tiny muted">
                          {achievement.current}/{achievement.target} {achievement.unit}
                        </span>
                      </div>
                    )}
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="tiny muted">Earned {new Date(achievement.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </div>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Set a goal"
        subtitle="Specific, measurable, and yours."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary grow" onClick={handleCreate}>
              Create goal
            </button>
          </>
        }
      >
        <div className="field">
          <span className="field-label">Goal type</span>
          <div className="goal-kind-grid">
            {GOAL_KINDS.map((kind) => (
              <button
                type="button"
                key={kind}
                className="chip"
                data-active={form.kind === kind}
                onClick={() => selectKind(kind)}
              >
                {goalKindLabel(kind)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-grid mt-3">
          <div className="field">
            <label className="field-label" htmlFor="goal-title">
              Title <span className="muted">(optional)</span>
            </label>
            <input
              id="goal-title"
              className="input"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Break 100 kg on bench"
            />
          </div>

          {form.kind === 'exercise' && (
            <div className="field">
              <span className="field-label">Exercise</span>
              <button type="button" className="input" style={{ textAlign: 'left' }} onClick={() => setExercisePickerOpen(true)}>
                {form.exerciseId ? getExercise(form.exerciseId, customExercises)?.name ?? 'Choose exercise' : 'Choose an exercise'}
              </button>
            </div>
          )}

          <div className="inline-fields">
            <div className="field">
              <label className="field-label" htmlFor="goal-target">
                Target
              </label>
              <div className="input-group">
                <input
                  id="goal-target"
                  className="input"
                  inputMode="decimal"
                  value={form.target}
                  onChange={(event) => setForm({ ...form, target: event.target.value.replace(/[^\d.,]/g, '') })}
                />
                <span className="input-suffix">{targetUnit(form.kind)}</span>
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="goal-deadline">
                Deadline <span className="muted">(optional)</span>
              </label>
              <input
                id="goal-deadline"
                type="date"
                className="input"
                value={form.deadline}
                onChange={(event) => setForm({ ...form, deadline: event.target.value })}
              />
            </div>
          </div>

          {form.kind === 'bodyweight' && (
            <div className="inline-fields">
              <div className="field">
                <label className="field-label" htmlFor="goal-start-weight">
                  Starting weight
                </label>
                <div className="input-group">
                  <input
                    id="goal-start-weight"
                    className="input"
                    value={form.startWeight}
                    onChange={(event) => setForm({ ...form, startWeight: event.target.value.replace(/[^\d.,]/g, '') })}
                  />
                  <span className="input-suffix">{weightUnit(profile.unitSystem)}</span>
                </div>
              </div>
              <div className="field">
                <span className="field-label">Current</span>
                <div className="input" aria-label="Current bodyweight">
                  {formatWeight(currentWeight, profile.unitSystem)}
                </div>
              </div>
            </div>
          )}

          {form.kind === 'exercise' && (
            <div className="field">
              <label className="field-label" htmlFor="goal-start-lift">
                Current best <span className="muted">(optional)</span>
              </label>
              <div className="input-group">
                <input
                  id="goal-start-lift"
                  className="input"
                  inputMode="decimal"
                  value={form.startLift}
                  onChange={(event) => setForm({ ...form, startLift: event.target.value.replace(/[^\d.,]/g, '') })}
                  placeholder="e.g. 80"
                />
                <span className="input-suffix">{weightUnit(profile.unitSystem)}</span>
              </div>
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="goal-note">
              Why it matters <span className="muted">(optional)</span>
            </label>
            <textarea
              id="goal-note"
              className="textarea"
              rows={2}
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="The reason you’ll keep showing up."
            />
          </div>
        </div>
        <p className="field-hint mt-2">Progress updates automatically from your logged workouts, lifts and check-ins.</p>
      </Sheet>

      <ExercisePicker
        open={exercisePickerOpen}
        onClose={() => setExercisePickerOpen(false)}
        title="Choose an exercise"
        onSelect={(exercise) => setForm((current) => ({ ...current, exerciseId: exercise.id }))}
      />

      <ConfirmSheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this goal?"
        message="The target will be removed. Your workout history and badges are unaffected."
        confirmLabel="Delete goal"
        danger
        onConfirm={() => {
          if (deleteTarget) {
            deleteGoal(deleteTarget.id);
            toast('Goal deleted.', 'success');
          }
        }}
      />
    </div>
  );
}
