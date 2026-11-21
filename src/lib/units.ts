import type { UnitSystem } from '../types';

const LB_PER_KG = 2.2046226218;

export function kgToDisplay(kg: number, units: UnitSystem): number {
  return units === 'imperial' ? kg * LB_PER_KG : kg;
}

export function displayToKg(value: number, units: UnitSystem): number {
  return units === 'imperial' ? value / LB_PER_KG : value;
}

export function weightUnit(units: UnitSystem): string {
  return units === 'imperial' ? 'lb' : 'kg';
}

export function formatUnits(units: UnitSystem): string {
  return weightUnit(units);
}

export function cmToDisplay(cm: number, units: UnitSystem): number {
  return units === 'imperial' ? cm / 2.54 : cm;
}

export function displayToCm(value: number, units: UnitSystem): number {
  return units === 'imperial' ? value * 2.54 : value;
}

export function lengthUnit(units: UnitSystem): string {
  return units === 'imperial' ? 'in' : 'cm';
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function formatWeight(kg: number | null | undefined, units: UnitSystem, opts: { decimals?: number } = {}): string {
  if (kg == null || Number.isNaN(kg)) return '—';
  const value = kgToDisplay(kg, units);
  const decimals = opts.decimals ?? (units === 'imperial' ? 1 : 1);
  const trimmed = Number(value.toFixed(decimals));
  return `${trimmed} ${weightUnit(units)}`;
}

export function formatWeightValue(kg: number | null | undefined, units: UnitSystem, decimals = 1): string {
  if (kg == null || Number.isNaN(kg)) return '';
  return String(Number(kgToDisplay(kg, units).toFixed(decimals)));
}

export function formatLength(cm: number | null | undefined, units: UnitSystem): string {
  if (cm == null || Number.isNaN(cm)) return '—';
  const value = cmToDisplay(cm, units);
  return `${Number(value.toFixed(1))} ${lengthUnit(units)}`;
}

export function formatHeight(cm: number | null | undefined, units: UnitSystem): string {
  if (cm == null) return '—';
  if (units === 'imperial') {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches - feet * 12);
    return `${feet}′ ${inches}″`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatVolume(kg: number, units: UnitSystem): string {
  const value = kgToDisplay(kg, units);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m ${weightUnit(units)}`;
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k ${weightUnit(units)}`;
  return `${Math.round(value).toLocaleString('en-US')} ${weightUnit(units)}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0m';
  if (seconds < 60) return '<1m';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function formatTimer(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toLocaleString('en-US');
}
