import { describe, expect, it } from 'vitest';
import { calculatePlates, warmupPlan } from './plates';

describe('plate calculator', () => {
  it('calculates a metric load per side', () => {
    const result = calculatePlates(100, 'metric');
    expect(result?.barWeight).toBe(20);
    expect(result?.perSideWeight).toBe(40);
    expect(result?.plates).toEqual([
      { weight: 25, count: 1 },
      { weight: 15, count: 1 },
    ]);
    expect(result?.leftoverPerSide).toBe(0);
  });

  it('uses fractional plates and reports leftovers honestly', () => {
    const fractional = calculatePlates(102.5, 'metric');
    expect(fractional?.perSideWeight).toBe(41.25);
    expect(fractional?.achievableTotal).toBe(102.5);

    const uneven = calculatePlates(101, 'metric');
    expect(uneven?.leftoverPerSide).toBe(0.5);
    expect(uneven?.achievableTotal).toBe(100);
  });

  it('uses pounds and a 45 lb bar for imperial users', () => {
    const result = calculatePlates(135, 'imperial');
    expect(result?.barWeight).toBe(45);
    expect(result?.perSideWeight).toBe(45);
    expect(result?.plates).toEqual([{ weight: 45, count: 1 }]);
  });

  it('rejects loads lighter than the bar', () => {
    expect(calculatePlates(10, 'metric')).toBeNull();
    expect(calculatePlates(20, 'imperial')).toBeNull();
  });
});

describe('warm-up generator', () => {
  it('builds an ascending ramp below the working weight', () => {
    const plan = warmupPlan(100, 'metric');
    expect(plan.map((set) => set.weightKg)).toEqual([40, 60, 80]);
    expect(plan.map((set) => set.reps)).toEqual([5, 3, 2]);
  });

  it('handles light isolation loads without duplicate weights', () => {
    const plan = warmupPlan(8, 'metric');
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every((set) => set.weightKg > 0 && set.weightKg < 8)).toBe(true);
    expect(new Set(plan.map((set) => set.weightKg)).size).toBe(plan.length);
  });

  it('returns nothing for an empty working weight', () => {
    expect(warmupPlan(0, 'metric')).toEqual([]);
  });
});
