import type { BodyEntry, MeasurementKey, Profile } from '../types';

export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  neck: 'Neck',
  shoulders: 'Shoulders',
  chest: 'Chest',
  waist: 'Waist',
  hips: 'Hips',
  leftArm: 'Left arm',
  rightArm: 'Right arm',
  leftThigh: 'Left thigh',
  rightThigh: 'Right thigh',
  calves: 'Calves',
};

export const MOODS = [
  { value: 1, label: 'Rough', emoji: '😞' },
  { value: 2, label: 'Low', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😄' },
];

export function sortedBodyEntries(entries: BodyEntry[]): BodyEntry[] {
  return entries.slice().sort((a, b) => a.date.localeCompare(b.date));
}

export function latestBodyEntry(entries: BodyEntry[]): BodyEntry | null {
  const sorted = sortedBodyEntries(entries);
  return sorted[sorted.length - 1] ?? null;
}

export function latestWeight(entries: BodyEntry[], profile: Profile): { kg: number; date: string } | null {
  const withWeight = sortedBodyEntries(entries).filter((entry) => entry.weightKg);
  if (withWeight.length > 0) {
    const last = withWeight[withWeight.length - 1];
    return { kg: last.weightKg as number, date: last.date };
  }
  if (profile.weightKg) return { kg: profile.weightKg, date: profile.createdAt.slice(0, 10) };
  return null;
}

export function weightSeries(entries: BodyEntry[]): Array<{ date: string; kg: number }> {
  return sortedBodyEntries(entries)
    .filter((entry) => entry.weightKg)
    .map((entry) => ({ date: entry.date, kg: entry.weightKg as number }));
}

export function weightChange(entries: BodyEntry[], days = 30): number | null {
  const series = weightSeries(entries);
  if (series.length < 2) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const older = [...series].reverse().find((point) => point.date <= cutoffKey) ?? series[0];
  const latest = series[series.length - 1];
  return latest.kg - older.kg;
}

export function measurementSeries(entries: BodyEntry[], key: MeasurementKey): Array<{ date: string; value: number }> {
  return sortedBodyEntries(entries)
    .filter((entry) => entry.measurements[key] != null)
    .map((entry) => ({ date: entry.date, value: entry.measurements[key] as number }));
}

export function latestMeasurements(entries: BodyEntry[]): Partial<Record<MeasurementKey, number>> {
  const latest = latestBodyEntry(entries);
  return latest?.measurements ?? {};
}

export function recoveryScore(entry: BodyEntry | null): number | null {
  if (!entry) return null;
  const energy = entry.energy ?? 3;
  const sleep = Math.min(1.2, (entry.sleepHours ?? 7) / 8);
  const soreness = entry.soreness ?? 2;
  const mood = entry.mood ?? 3;
  const score = (energy / 5) * 35 + sleep * 30 + ((6 - soreness) / 5) * 20 + (mood / 5) * 15;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function averageSleep(entries: BodyEntry[], days = 7): number | null {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const key = cutoff.toISOString().slice(0, 10);
  const recent = entries.filter((entry) => entry.date >= key && entry.sleepHours != null);
  if (recent.length === 0) return null;
  return recent.reduce((sum, entry) => sum + (entry.sleepHours ?? 0), 0) / recent.length;
}
