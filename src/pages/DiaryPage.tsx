import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Moon,
  NotebookPen,
  Plus,
  Smile,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Sheet } from '../components/ui/Sheet';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { EmptyState } from '../components/ui/EmptyState';
import { LineChart, BarChart } from '../components/charts/Charts';
import {
  MOODS,
  MEASUREMENT_LABELS,
  averageSleep,
  latestBodyEntry,
  latestWeight,
  recoveryScore,
  weightChange,
  weightSeries,
} from '../lib/body';
import type { BodyEntry, MeasurementKey, UnitSystem } from '../types';
import { createId } from '../lib/ids';
import { toDisplayDate, todayKey } from '../lib/date';
import {
  cmToDisplay,
  displayToCm,
  displayToKg,
  formatLength,
  formatWeight,
  formatWeightValue,
  kgToDisplay,
  lengthUnit,
  weightUnit,
} from '../lib/units';
import { toast } from '../store/toastStore';

interface CheckInForm {
  weight: string;
  measurements: Partial<Record<MeasurementKey, string>>;
  energy: number;
  sleepHours: string;
  soreness: number;
  mood: number;
  notes: string;
  date: string;
}

const emptyForm = (date: string): CheckInForm => ({
  weight: '',
  measurements: {},
  energy: 3,
  sleepHours: '',
  soreness: 2,
  mood: 3,
  notes: '',
  date,
});

export function DiaryPage() {
  const profile = useAppStore((state) => state.profile);
  const bodyEntries = useAppStore((state) => state.bodyEntries);
  const upsertBodyEntry = useAppStore((state) => state.upsertBodyEntry);
  const deleteBodyEntry = useAppStore((state) => state.deleteBodyEntry);
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CheckInForm>(emptyForm(todayKey()));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BodyEntry | null>(null);

  useEffect(() => {
    if (searchParams.get('checkin') === '1') {
      const existing = bodyEntries.find((entry) => entry.date === todayKey());
      setEditingId(existing?.id ?? null);
      setForm(existing ? formFromEntry(existing, profile.unitSystem) : emptyForm(todayKey()));
      setOpen(true);
    }
  }, [searchParams, bodyEntries, profile.unitSystem]);

  const sorted = useMemo(() => bodyEntries.slice().sort((a, b) => b.date.localeCompare(a.date)), [bodyEntries]);
  const latest = latestBodyEntry(bodyEntries);
  const currentWeight = latestWeight(bodyEntries, profile);
  const change = weightChange(bodyEntries, 30);
  const recovery = recoveryScore(latest);
  const sleepAvg = averageSleep(bodyEntries, 7);
  const weightPoints = useMemo(
    () =>
      weightSeries(bodyEntries)
        .slice(-12)
        .map((point) => ({
          label: new Date(`${point.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Number(kgToDisplay(point.kg, profile.unitSystem).toFixed(1)),
        })),
    [bodyEntries, profile.unitSystem],
  );

  const sleepPoints = useMemo(
    () =>
      bodyEntries
        .filter((entry) => entry.sleepHours)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-10)
        .map((entry) => ({
          label: new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
          value: entry.sleepHours ?? 0,
        })),
    [bodyEntries],
  );

  const latestMeasurements = latest?.measurements ?? {};
  const measurementKeys = Object.keys(MEASUREMENT_LABELS) as MeasurementKey[];
  const filledMeasurements = measurementKeys.filter((key) => latestMeasurements[key] != null);

  const openNew = () => {
    const existing = bodyEntries.find((entry) => entry.date === todayKey());
    setEditingId(existing?.id ?? null);
    setForm(existing ? formFromEntry(existing, profile.unitSystem) : emptyForm(todayKey()));
    setOpen(true);
  };

  const openEdit = (entry: BodyEntry) => {
    setEditingId(entry.id);
    setForm(formFromEntry(entry, profile.unitSystem));
    setOpen(true);
  };

  const save = () => {
    if (!form.date) {
      toast('Choose a date for the check-in.', 'error');
      return;
    }
    const weightValue = Number(form.weight.replace(',', '.'));
    const weightKg = Number.isFinite(weightValue) && weightValue > 0 ? Math.round(displayToKg(weightValue, profile.unitSystem) * 10) / 10 : undefined;
    const measurements: Partial<Record<MeasurementKey, number>> = {};
    for (const key of measurementKeys) {
      const raw = form.measurements[key];
      const value = Number((raw ?? '').replace(',', '.'));
      if (Number.isFinite(value) && value > 0) {
        measurements[key] = Math.round(displayToCm(value, profile.unitSystem) * 10) / 10;
      }
    }
    const sleep = Number(form.sleepHours.replace(',', '.'));
    const entry: BodyEntry = {
      id: editingId ?? createId('body'),
      date: form.date,
      weightKg,
      measurements,
      energy: form.energy,
      sleepHours: Number.isFinite(sleep) && sleep > 0 ? Math.min(16, sleep) : undefined,
      soreness: form.soreness,
      mood: form.mood,
      notes: form.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    upsertBodyEntry(entry);
    setOpen(false);
    toast('Daily check-in saved.', 'success');
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Diary"
        title="Daily check-in"
        subtitle="Bodyweight, measurements, sleep and how you actually feel. The context behind the training."
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
            <Plus /> Check in
          </button>
        }
      />

      <div className="diary-summary">
        <div className="card diary-weight-card">
          <p className="eyebrow">Bodyweight</p>
          <p className="stat-value" style={{ fontSize: '1.9rem' }}>
            {currentWeight ? formatWeight(currentWeight.kg, profile.unitSystem) : '—'}
          </p>
          <p className="tiny muted">{currentWeight ? `Updated ${toDisplayDate(currentWeight.date)}` : 'Add your first check-in'}</p>
          {change != null && (
            <span className="stat-delta" data-negative={change > 0 && profile.goal === 'lose'}>
              {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(kgToDisplay(change, profile.unitSystem)).toFixed(1)} {weightUnit(profile.unitSystem)} over 30 days
            </span>
          )}
        </div>
        <div className="card card-sm">
          <p className="eyebrow">
            <Zap size={11} /> Readiness
          </p>
          <p className="stat-value" style={{ fontSize: '1.9rem' }}>
            {recovery ?? '—'}
          </p>
          <p className="tiny muted">{recovery == null ? 'Log a check-in' : recovery >= 75 ? 'Ready to push' : recovery >= 55 ? 'Moderate' : 'Recover first'}</p>
        </div>
        <div className="card card-sm">
          <p className="eyebrow">
            <Moon size={11} /> Sleep · 7 day
          </p>
          <p className="stat-value" style={{ fontSize: '1.9rem' }}>
            {sleepAvg != null ? sleepAvg.toFixed(1) : '—'}
            <small>h</small>
          </p>
          <p className="tiny muted">Aim for 7–9 hours</p>
        </div>
        <div className="card card-sm">
          <p className="eyebrow">
            <Smile size={11} /> Mood
          </p>
          <p className="stat-value" style={{ fontSize: '1.9rem' }}>
            {latest?.mood ? MOODS.find((mood) => mood.value === latest.mood)?.emoji : '—'}
          </p>
          <p className="tiny muted">{latest?.mood ? MOODS.find((mood) => mood.value === latest.mood)?.label : 'Not logged'}</p>
        </div>
      </div>

      <div className="diary-grid">
        <div className="stack">
          <div className="chart-card">
            <div className="chart-head">
              <div>
                <p className="chart-title">Bodyweight trend</p>
                <p className="chart-sub">Last 12 check-ins</p>
              </div>
              <span className="chart-value">
                {currentWeight ? formatWeight(currentWeight.kg, profile.unitSystem) : '—'}
              </span>
            </div>
            <LineChart
              points={weightPoints}
              formatValue={(value) => `${value}`}
              ariaLabel="Bodyweight trend"
              emptyLabel="Two check-ins will reveal the trend."
            />
          </div>

          <div className="chart-card">
            <div className="chart-head">
              <div>
                <p className="chart-title">Sleep</p>
                <p className="chart-sub">Hours per night · last 10 logs</p>
              </div>
            </div>
            <BarChart
              points={sleepPoints}
              formatValue={(value) => `${value}h`}
              ariaLabel="Sleep hours"
              highlightLast
              emptyLabel="Log sleep in a check-in to see the pattern."
            />
          </div>

          <div className="card">
            <div className="between">
              <h2 className="section-title" style={{ fontSize: '1rem' }}>
                Measurements
              </h2>
              <span className="badge">{filledMeasurements.length} tracked</span>
            </div>
            {filledMeasurements.length === 0 ? (
              <p className="small muted mt-2">Add measurements in a check-in to track more than the scale.</p>
            ) : (
              <div className="measurement-grid mt-3">
                {filledMeasurements.map((key) => (
                  <div key={key} className="measurement-cell">
                    <span className="tiny muted">{MEASUREMENT_LABELS[key]}</span>
                    <span className="strong numeric">
                      {formatLength(latestMeasurements[key] ?? null, profile.unitSystem)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="between" style={{ marginBottom: 8 }}>
              <h2 className="section-title" style={{ fontSize: '1rem' }}>
                Recent check-ins
              </h2>
              <span className="badge">{bodyEntries.length}</span>
            </div>
            {sorted.length === 0 ? (
              <EmptyState
                icon={<NotebookPen />}
                title="No check-ins yet"
                text="A 60-second daily note gives context to the training numbers."
                action={
                  <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
                    Add today
                  </button>
                }
              />
            ) : (
              <div className="list">
                {sorted.slice(0, 8).map((entry) => (
                  <button type="button" className="list-item" key={entry.id} onClick={() => openEdit(entry)}>
                    <span className="entity-icon entity-icon-blue">
                      <NotebookPen />
                    </span>
                    <span className="list-main">
                      <span className="list-title">{toDisplayDate(entry.date)}</span>
                      <span className="list-sub">
                        {entry.weightKg ? formatWeight(entry.weightKg, profile.unitSystem) : 'No weight'} ·{' '}
                        {entry.sleepHours ? `${entry.sleepHours}h sleep` : 'Sleep not logged'}
                        {entry.mood ? ` · ${MOODS.find((mood) => mood.value === entry.mood)?.emoji}` : ''}
                      </span>
                    </span>
                    <ChevronRight size={15} className="muted" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="info-note">
            <Sparkles />
            <span>
              Trends matter more than single days. A morning weight can swing a kilo on water alone; look at the line, not
              the dot.
            </span>
          </div>

          {latest && (
            <div className="card">
              <div className="between">
                <p className="eyebrow">Latest notes</p>
                <span className="badge">{toDisplayDate(latest.date)}</span>
              </div>
              <p className="small text-2 mt-2" style={{ lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {latest.notes || 'No notes for this check-in.'}
              </p>
              <button type="button" className="btn btn-sm btn-secondary btn-block mt-3" onClick={() => openEdit(latest)}>
                Edit check-in
              </button>
            </div>
          )}
        </aside>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Edit check-in' : 'Daily check-in'}
        subtitle="Only the fields you fill in are saved."
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary grow" onClick={save}>
              Save check-in
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="checkin-date">
              Date
            </label>
            <input
              id="checkin-date"
              type="date"
              className="input"
              value={form.date}
              max={todayKey()}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </div>
          <div className="inline-fields">
            <div className="field">
              <label className="field-label" htmlFor="checkin-weight">
                Bodyweight
              </label>
              <div className="input-group">
                <input
                  id="checkin-weight"
                  className="input"
                  inputMode="decimal"
                  value={form.weight}
                  onChange={(event) => setForm({ ...form, weight: event.target.value.replace(/[^\d.,]/g, '') })}
                  placeholder={currentWeight ? formatWeightValue(currentWeight.kg, profile.unitSystem, 1) : 'e.g. 78'}
                />
                <span className="input-suffix">{weightUnit(profile.unitSystem)}</span>
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="checkin-sleep">
                Sleep
              </label>
              <div className="input-group">
                <input
                  id="checkin-sleep"
                  className="input"
                  inputMode="decimal"
                  value={form.sleepHours}
                  onChange={(event) => setForm({ ...form, sleepHours: event.target.value.replace(/[^\d.,]/g, '') })}
                  placeholder="7.5"
                />
                <span className="input-suffix">hrs</span>
              </div>
            </div>
          </div>

          <div className="field">
            <span className="field-label">Energy</span>
            <div className="rating-row" role="group" aria-label="Energy level">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="rating-button"
                  data-active={form.energy === value}
                  onClick={() => setForm({ ...form, energy: value })}
                  aria-label={`Energy ${value} of 5`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="field-hint">{form.energy <= 2 ? 'Low — consider an easier session.' : form.energy >= 4 ? 'High — good day to push.' : 'Steady.'}</p>
          </div>

          <div className="field">
            <span className="field-label">Soreness</span>
            <div className="rating-row" role="group" aria-label="Soreness level">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="rating-button"
                  data-active={form.soreness === value}
                  onClick={() => setForm({ ...form, soreness: value })}
                  aria-label={`Soreness ${value} of 5`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="field-hint">{form.soreness >= 4 ? 'Very sore — technique and recovery come first.' : '1 = fresh, 5 = very sore.'}</p>
          </div>

          <div className="field">
            <span className="field-label">Mood</span>
            <div className="rating-row" role="group" aria-label="Mood">
              {MOODS.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  className="mood-button"
                  data-active={form.mood === mood.value}
                  onClick={() => setForm({ ...form, mood: mood.value })}
                  aria-label={mood.label}
                >
                  <span>{mood.emoji}</span>
                  <small>{mood.label}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="between">
              <span className="field-label">Measurements</span>
              <span className="tiny muted">{lengthUnit(profile.unitSystem)}</span>
            </div>
            <div className="measure-input-grid">
              {measurementKeys.map((key) => (
                <label className="measure-input" key={key}>
                  <span className="tiny muted">{MEASUREMENT_LABELS[key]}</span>
                  <input
                    className="input"
                    inputMode="decimal"
                    value={form.measurements[key] ?? ''}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        measurements: { ...form.measurements, [key]: event.target.value.replace(/[^\d.,]/g, '') },
                      })
                    }
                    placeholder="—"
                    aria-label={MEASUREMENT_LABELS[key]}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="checkin-notes">
              Notes
            </label>
            <textarea
              id="checkin-notes"
              className="textarea"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Energy, stress, hunger, anything worth remembering…"
            />
          </div>
        </div>

        {editingId && (
          <button
            type="button"
            className="btn btn-danger btn-sm btn-block mt-3"
            onClick={() => {
              const target = bodyEntries.find((entry) => entry.id === editingId) ?? null;
              setOpen(false);
              setDeleteTarget(target);
            }}
          >
            <Trash2 /> Delete this check-in
          </button>
        )}
      </Sheet>

      <ConfirmSheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete check-in?"
        message="This daily entry will be removed from your diary. Workouts are unaffected."
        confirmLabel="Delete check-in"
        danger
        onConfirm={() => {
          if (deleteTarget) {
            deleteBodyEntry(deleteTarget.id);
            toast('Check-in deleted.', 'success');
          }
        }}
      />
    </div>
  );
}

function formFromEntry(entry: BodyEntry, units: UnitSystem): CheckInForm {
  const measurements: Partial<Record<MeasurementKey, string>> = {};
  for (const [key, value] of Object.entries(entry.measurements) as Array<[MeasurementKey, number]>) {
    measurements[key] = String(Number(cmToDisplay(value, units).toFixed(1)));
  }
  return {
    date: entry.date,
    weight: entry.weightKg != null ? formatWeightValue(entry.weightKg, units, 1) : '',
    measurements,
    energy: entry.energy ?? 3,
    sleepHours: entry.sleepHours != null ? String(entry.sleepHours) : '',
    soreness: entry.soreness ?? 2,
    mood: entry.mood ?? 3,
    notes: entry.notes ?? '',
  };
}
