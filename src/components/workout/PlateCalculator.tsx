import { useEffect, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import type { UnitSystem } from '../../types';
import { defaultBarWeight, calculatePlates, kgToDisplayWeight } from '../../lib/plates';
import { Sheet } from '../ui/Sheet';
import { weightUnit } from '../../lib/units';

interface PlateCalculatorProps {
  open: boolean;
  onClose: () => void;
  initialWeightKg: number | null;
  units: UnitSystem;
}

export function PlateCalculator({ open, onClose, initialWeightKg, units }: PlateCalculatorProps) {
  const bar = defaultBarWeight(units);
  const initial = initialWeightKg ? kgToDisplayWeight(initialWeightKg, units) : bar;
  const [weight, setWeight] = useState(String(initial));

  useEffect(() => {
    if (open) setWeight(String(initialWeightKg ? kgToDisplayWeight(initialWeightKg, units) : defaultBarWeight(units)));
  }, [open, initialWeightKg, units]);

  const parsed = Number(weight.replace(',', '.'));
  const result = calculatePlates(parsed, units);
  const unit = weightUnit(units);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Plate calculator"
      subtitle={`Per side · standard ${bar} ${unit} bar`}
    >
      <div className="field">
        <label className="field-label" htmlFor="plate-total">
          Total weight
        </label>
        <div className="input-group">
          <input
            id="plate-total"
            className="input"
            inputMode="decimal"
            value={weight}
            onChange={(event) => setWeight(event.target.value.replace(/[^\d.,]/g, ''))}
            placeholder={String(bar + 20)}
            autoFocus
          />
          <span className="input-suffix">{unit}</span>
        </div>
        <p className="field-hint">Enter the whole bar, including the bar itself.</p>
      </div>

      {!result ? (
        <div className="plate-empty">
          <Info size={18} />
          <p>
            That’s lighter than the {bar} {unit} bar. Use a lighter bar or add a little weight.
          </p>
        </div>
      ) : (
        <>
          <div className="plate-summary">
            <div>
              <span className="stat-value">
                {result.totalWeight} <small>{unit}</small>
              </span>
              <span className="stat-label">target</span>
            </div>
            <div>
              <span className="stat-value">
                {result.perSideWeight} <small>{unit}</small>
              </span>
              <span className="stat-label">per side</span>
            </div>
            <div>
              <span className="stat-value">
                {result.barWeight} <small>{unit}</small>
              </span>
              <span className="stat-label">bar</span>
            </div>
          </div>

          <div className="plate-visual">
            {result.plates.length === 0 ? (
              <p className="small muted">Just the bar.</p>
            ) : (
              result.plates.map((plate) => (
                <span className="plate-chip" key={plate.weight}>
                  <span className="plate-disc" style={{ width: 26 + Math.min(20, plate.weight) * 0.55, height: 26 + Math.min(20, plate.weight) * 0.55 }} />
                  <b>{plate.count} ×</b> {plate.weight} {unit}
                </span>
              ))
            )}
          </div>

          <div className="plate-total-row">
            <span>
              <Calculator size={15} /> Loaded total
            </span>
            <strong>
              {result.achievableTotal} {unit}
            </strong>
          </div>

          {result.leftoverPerSide > 0 && (
            <div className="info-note warn-note mt-3">
              <Info />
              <span>
                Closest loadable total is {result.achievableTotal} {unit} — {result.leftoverPerSide} {unit} per side short.
                Adjust the target or use a different plate combination.
              </span>
            </div>
          )}
          <p className="tiny muted mt-2">
            Assumes {bar} {unit} bar and standard plates. Always check your own equipment.
          </p>
        </>
      )}
    </Sheet>
  );
}
