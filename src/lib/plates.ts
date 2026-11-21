import type { UnitSystem } from '../types';
import { kgToDisplay, displayToKg } from './units';

export interface WarmupSetPlan {
  weightKg: number;
  reps: number;
  percent: number;
}

function warmupStep(weightKg: number, units: UnitSystem): number {
  if (units === 'imperial') {
    return weightKg * 2.2046226218 < 45 ? 2.5 / 2.2046226218 : 5 / 2.2046226218;
  }
  return weightKg < 20 ? 1 : 2.5;
}

function roundTo(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

/**
 * A conservative three-step warm-up ramp. It never generates a set at or above
 * the working weight and de-duplicates loads when the working weight is light.
 */
export function warmupPlan(workingWeightKg: number, units: UnitSystem): WarmupSetPlan[] {
  if (!Number.isFinite(workingWeightKg) || workingWeightKg <= 0) return [];
  const step = warmupStep(workingWeightKg, units);
  const plan: WarmupSetPlan[] = [
    { percent: 40, reps: 5 },
    { percent: 60, reps: 3 },
    { percent: 80, reps: 2 },
  ]
    .map(({ percent, reps }) => ({
      percent,
      reps,
      weightKg: Math.round(roundTo((workingWeightKg * percent) / 100, step) * 10) / 10,
    }))
    .filter((set, index, all) => set.weightKg > 0 && set.weightKg < workingWeightKg && all.findIndex((item) => item.weightKg === set.weightKg) === index);
  return plan;
}

export interface PlateCount {
  weight: number;
  count: number;
}

export interface PlateResult {
  unit: 'kg' | 'lb';
  barWeight: number;
  totalWeight: number;
  perSideWeight: number;
  plates: PlateCount[];
  leftoverPerSide: number;
  achievableTotal: number;
}

const INVENTORY: Record<'kg' | 'lb', { bar: number; plates: number[] }> = {
  kg: { bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25] },
  lb: { bar: 45, plates: [45, 35, 25, 10, 5, 2.5] },
};

/** Calculate plates per side for a standard barbell in the user's display units. */
export function calculatePlates(totalDisplayWeight: number, units: UnitSystem): PlateResult | null {
  const unit: 'kg' | 'lb' = units === 'imperial' ? 'lb' : 'kg';
  const inventory = INVENTORY[unit];
  if (!Number.isFinite(totalDisplayWeight) || totalDisplayWeight < inventory.bar) return null;

  const sideRaw = (totalDisplayWeight - inventory.bar) / 2;
  let remaining = Math.round(sideRaw * 100) / 100;
  const plates: PlateCount[] = [];
  for (const plate of inventory.plates) {
    const count = Math.floor((remaining + 1e-9) / plate);
    if (count > 0) {
      plates.push({ weight: plate, count });
      remaining = Math.round((remaining - plate * count) * 100) / 100;
    }
  }

  const perSideWeight = Math.round((sideRaw - remaining) * 100) / 100;
  const achievableTotal = Math.round((inventory.bar + perSideWeight * 2) * 100) / 100;

  return {
    unit,
    barWeight: inventory.bar,
    totalWeight: Math.round(totalDisplayWeight * 100) / 100,
    perSideWeight,
    plates,
    leftoverPerSide: Math.max(0, remaining),
    achievableTotal,
  };
}

export function defaultBarWeight(units: UnitSystem): number {
  return units === 'imperial' ? 45 : 20;
}

export function kgToDisplayWeight(kg: number, units: UnitSystem): number {
  return Number(kgToDisplay(kg, units).toFixed(1));
}

export function displayWeightToKg(value: number, units: UnitSystem): number {
  return Math.round(displayToKg(value, units) * 10) / 10;
}
