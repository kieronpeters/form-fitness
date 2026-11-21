import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Repeat, Trash2 } from 'lucide-react';
import type { Recurrence } from '../types';
import { useAppStore } from '../store/appStore';
import { getExercise } from '../data/exercises';
import { toLongDate, weekdayShort } from '../lib/date';
import { Sheet } from './ui/Sheet';
import { Segmented } from './ui/Segmented';
import { toast } from '../store/toastStore';
import { formatTargetReps } from '../lib/workout';

interface ScheduleSheetProps {
  open: boolean;
  onClose: () => void;
  programId: string | null;
  programDayId: string | null;
  date: string;
  ruleId?: string | null;
}

const RECURRENCE_OPTIONS: Array<{ value: Recurrence; label: string }> = [
  { value: 'once', label: 'Once' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: '2 weeks' },
  { value: 'daily', label: 'Daily' },
];

export function ScheduleSheet({ open, onClose, programId, programDayId, date, ruleId }: ScheduleSheetProps) {
  const programs = useAppStore((state) => state.programs);
  const scheduleRules = useAppStore((state) => state.scheduleRules);
  const scheduleWorkout = useAppStore((state) => state.scheduleWorkout);
  const updateScheduleRule = useAppStore((state) => state.updateScheduleRule);
  const deleteScheduleRule = useAppStore((state) => state.deleteScheduleRule);
  const existing = scheduleRules.find((rule) => rule.id === ruleId);

  const [startDate, setStartDate] = useState(date);
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? 'once');
  const [weekdays, setWeekdays] = useState<number[]>(existing?.weekdays?.length ? existing.weekdays : [new Date(`${date}T12:00:00`).getDay()]);
  const [endDate, setEndDate] = useState(existing?.endDate ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStartDate(existing?.startDate ?? date);
    setRecurrence(existing?.recurrence ?? 'once');
    setWeekdays(existing?.weekdays?.length ? existing.weekdays : [new Date(`${date}T12:00:00`).getDay()]);
    setEndDate(existing?.endDate ?? '');
  }, [open, date, existing]);

  const program = useMemo(() => programs.find((item) => item.id === programId), [programs, programId]);
  const day = program?.days.find((item) => item.id === programDayId);

  if (!program || !programId || !programDayId || !day) return null;

  const showWeekdays = recurrence === 'weekly' || recurrence === 'biweekly' || recurrence === 'custom';

  const toggleWeekday = (weekday: number) => {
    setWeekdays((current) =>
      current.includes(weekday) ? current.filter((item) => item !== weekday) : [...current, weekday].sort(),
    );
  };

  const handleSave = () => {
    if (showWeekdays && weekdays.length === 0) {
      toast('Pick at least one weekday for a repeating session.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (ruleId) {
        updateScheduleRule(ruleId, {
          startDate,
          recurrence,
          weekdays: showWeekdays ? weekdays : [],
          endDate: endDate || undefined,
          active: true,
        });
        toast('Schedule updated.', 'success');
      } else {
        scheduleWorkout(programId, programDayId, startDate, recurrence, weekdays, endDate || undefined);
        toast(
          recurrence === 'once'
            ? 'Session added to your calendar.'
            : `Repeating ${recurrence === 'daily' ? 'daily' : recurrence === 'biweekly' ? 'every 2 weeks' : 'weekly'} — added to your plan.`,
          'success',
        );
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!ruleId) return;
    deleteScheduleRule(ruleId);
    toast('Repeat schedule removed.', 'success');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={ruleId ? 'Edit scheduled session' : 'Schedule this session'}
      subtitle={`${day.name} · ${program.name}`}
      footer={
        <>
          {ruleId && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} aria-label="Delete schedule">
              <Trash2 />
            </button>
          )}
          <button type="button" className="btn btn-primary grow" onClick={handleSave} disabled={saving}>
            {ruleId ? 'Save changes' : 'Add to calendar'}
          </button>
        </>
      }
    >
      <div className="schedule-preview">
        <span className="entity-icon entity-icon-lime">
          <CalendarDays />
        </span>
        <div className="grow">
          <p className="strong">{day.name}</p>
          <p className="tiny muted">
            {day.exercises.length} exercises · {day.focus}
          </p>
        </div>
      </div>

      <div className="field mt-3">
        <label className="field-label" htmlFor="schedule-start">
          Start date
        </label>
        <input
          id="schedule-start"
          type="date"
          className="input"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <p className="field-hint">{toLongDate(startDate)}</p>
      </div>

      <div className="field mt-3">
        <span className="field-label">Repeat</span>
        <Segmented options={RECURRENCE_OPTIONS} value={recurrence} onChange={setRecurrence} ariaLabel="Repeat pattern" />
      </div>

      {showWeekdays && (
        <div className="field mt-3">
          <span className="field-label">Days of the week</span>
          <div className="weekday-picker">
            {[1, 2, 3, 4, 5, 6, 0].map((weekday) => (
              <button
                key={weekday}
                type="button"
                className="weekday-toggle"
                data-active={weekdays.includes(weekday)}
                onClick={() => toggleWeekday(weekday)}
                aria-pressed={weekdays.includes(weekday)}
                aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday]}
              >
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][weekday]}
              </button>
            ))}
          </div>
          <p className="field-hint">
            <Repeat size={12} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
            {weekdays.length > 0 ? weekdays.map((weekday) => weekdayShort(weekday)).join(' · ') : 'Pick at least one day'}
          </p>
        </div>
      )}

      <div className="field mt-3">
        <label className="field-label" htmlFor="schedule-end">
          Stop repeating <span className="muted">(optional)</span>
        </label>
        <input
          id="schedule-end"
          type="date"
          className="input"
          value={endDate}
          min={startDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>

      {!ruleId && day.exercises[0] && (
        <div className="info-note mt-4">
          <CalendarDays />
          <span>
            First session starts with {getExercise(day.exercises[0].exerciseId)?.name ?? 'your first exercise'} —{' '}
            {day.exercises[0].sets} × {formatTargetReps(day.exercises[0].repsMin, day.exercises[0].repsMax)} — plus{' '}
            {Math.max(0, day.exercises.length - 1)} more exercises.
          </span>
        </div>
      )}
    </Sheet>
  );
}
