import { useEffect, useRef, useState } from 'react';

interface SetValueInputProps {
  value: number | null;
  placeholder?: string;
  onCommit: (value: number | null) => void;
  ariaLabel: string;
  suffix?: string;
  step?: number;
}

export function SetValueInput({ value, placeholder, onCommit, ariaLabel, suffix, step = 0.5 }: SetValueInputProps) {
  const [text, setText] = useState(value == null ? '' : String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(value == null ? '' : String(value));
  }, [value]);

  const commit = () => {
    focused.current = false;
    const normalized = text.replace(',', '.').trim();
    if (normalized === '') {
      onCommit(null);
      setText('');
      return;
    }
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setText(value == null ? '' : String(value));
      return;
    }
    onCommit(Math.round(parsed * 100) / 100);
    setText(String(Math.round(parsed * 100) / 100));
  };

  return (
    <div className="set-cell">
      <input
        type="text"
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.,]/g, '');
          setText(next);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            const base = Number(text) || 0;
            const next = Math.round((base + step) * 100) / 100;
            setText(String(next));
            onCommit(next);
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            const base = Number(text) || 0;
            const next = Math.max(0, Math.round((base - step) * 100) / 100);
            setText(String(next));
            onCommit(next);
          }
        }}
      />
      {suffix && <span className="set-unit">{suffix}</span>}
    </div>
  );
}
