interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  number?: string;
  tone?: string;
  trackColor?: string;
  ariaLabel?: string;
}

export function ProgressRing({
  value,
  size = 92,
  stroke = 8,
  label,
  number,
  tone = 'var(--accent)',
  trackColor = 'var(--surface-3)',
  ariaLabel,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div
      className="ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel ?? `${Math.round(clamped * 100)} percent${label ? ` of ${label}` : ''}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          className="ring-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-value"
          strokeLinecap="round"
        />
      </svg>
      <div className="ring-center">
        {number !== undefined && (
          <span className="ring-number" style={{ fontSize: Math.max(14, size * 0.27) }}>
            {number}
          </span>
        )}
        {label && (
          <span className="ring-label" style={{ fontSize: Math.max(8, size * 0.085) }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
