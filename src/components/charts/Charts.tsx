import { useId } from 'react';
import type { MuscleGroup } from '../../types';
import { MUSCLE_COLORS, MUSCLE_LABELS } from '../../data/exercises';

export interface ChartPoint {
  label: string;
  value: number;
}

function formatDefault(value: number): string {
  if (value >= 10_000) return `${(value / 1000).toFixed(0)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

interface LineChartProps {
  points: ChartPoint[];
  height?: number;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
  emptyLabel?: string;
  color?: string;
}

export function LineChart({
  points,
  height = 160,
  formatValue = formatDefault,
  ariaLabel = 'Trend chart',
  emptyLabel = 'Not enough data yet',
  color = 'var(--accent)',
}: LineChartProps) {
  const gradientId = useId().replace(/[:]/g, '');
  if (points.length < 2) {
    return <div className="chart-empty">{emptyLabel}</div>;
  }

  const width = 360;
  const padX = 10;
  const padTop = 14;
  const padBottom = 26;
  const values = points.map((point) => point.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= Math.max(1, Math.abs(min) * 0.02);
    max += Math.max(1, Math.abs(max) * 0.02);
  } else {
    const span = max - min;
    min -= span * 0.12;
    max += span * 0.12;
  }
  const innerWidth = width - padX * 2;
  const innerHeight = height - padTop - padBottom;

  const xFor = (index: number) => padX + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const yFor = (value: number) => padTop + innerHeight - ((value - min) / (max - min)) * innerHeight;

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index).toFixed(2)} ${yFor(point.value).toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L ${xFor(points.length - 1).toFixed(2)} ${padTop + innerHeight} L ${xFor(0).toFixed(2)} ${
    padTop + innerHeight
  } Z`;

  const last = points[points.length - 1];
  const gridValues = [max, (max + min) / 2, min];
  const labelIndices = points.length <= 4 ? points.map((_, index) => index) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <div>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${ariaLabel}. Latest ${formatValue(last.value)}. ${points.length} points.`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridValues.map((value, index) => (
          <g key={index}>
            <line
              x1={padX}
              x2={width - padX}
              y1={yFor(value)}
              y2={yFor(value)}
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray={index === 2 ? undefined : '3 4'}
            />
            <text x={padX} y={yFor(value) - 4} className="chart-axis-label">
              {formatValue(value)}
            </text>
          </g>
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={xFor(index)} cy={yFor(point.value)} r={index === points.length - 1 ? 4.2 : 2.6} fill={color} stroke="var(--surface)" strokeWidth="2">
              <title>{`${point.label}: ${formatValue(point.value)}`}</title>
            </circle>
          </g>
        ))}
        {labelIndices.map((index) => (
          <text key={`label-${index}`} x={xFor(index)} y={height - 7} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} className="chart-axis-label">
            {points[index].label}
          </text>
        ))}
      </svg>
    </div>
  );
}

interface BarChartProps {
  points: ChartPoint[];
  formatValue?: (value: number) => string;
  highlightLast?: boolean;
  height?: number;
  ariaLabel?: string;
  emptyLabel?: string;
}

export function BarChart({
  points,
  formatValue = formatDefault,
  highlightLast = true,
  height = 140,
  ariaLabel = 'Bar chart',
  emptyLabel = 'No data for this period yet.',
}: BarChartProps) {
  if (points.length === 0 || points.every((point) => point.value === 0)) {
    return <div className="chart-empty">{emptyLabel}</div>;
  }
  const max = Math.max(1, ...points.map((point) => point.value));
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));
  return (
    <div className="bar-chart" style={{ height }} role="img" aria-label={ariaLabel}>
      {points.map((point, index) => {
        const isLast = index === points.length - 1;
        const px = (point.value / max) * (height - 42);
        const showValue = point.value > 0 && (points.length <= 8 || isLast || index % labelEvery === 0);
        const showLabel = index % labelEvery === 0 || isLast;
        return (
          <div key={`${point.label}-${index}`} className="bar-column" data-active={highlightLast && isLast}>
            <span className="bar-column-value">{showValue ? formatValue(point.value) : ''}</span>
            <div className="bar-column-track">
              <div
                className="bar-column-fill"
                style={{ height: `${Math.max(3, px)}px` }}
                title={`${point.label}: ${formatValue(point.value)}`}
              />
            </div>
            <span className="bar-column-label">{showLabel ? point.label : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  ariaLabel?: string;
}

export function Sparkline({ values, width = 96, height = 32, color = 'var(--accent)', ariaLabel }: SparklineProps) {
  if (values.length < 2) {
    return <div style={{ width, height }} aria-hidden="true" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((value - min) / span) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} role="img" aria-label={ariaLabel ?? 'Trend sparkline'}>
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface MuscleBarsProps {
  data: Array<{ muscle: MuscleGroup; sets: number }>;
  limit?: number;
}

export function MuscleBars({ data, limit = 8 }: MuscleBarsProps) {
  const visible = data.filter((item) => item.sets > 0).slice(0, limit);
  const max = Math.max(1, ...visible.map((item) => item.sets));

  if (visible.length === 0) {
    return <div className="chart-empty">Muscle balance appears after your first logged workout.</div>;
  }

  return (
    <div className="muscle-distribution">
      {visible.map((item) => (
        <div className="muscle-bar-row" key={item.muscle}>
          <span className="muscle-bar-label">
            <span className="muscle-dot" style={{ background: MUSCLE_COLORS[item.muscle] }} />
            {MUSCLE_LABELS[item.muscle]}
          </span>
          <span className="bar" aria-hidden="true">
            <span
              className="bar-fill"
              style={{ width: `${(item.sets / max) * 100}%`, background: MUSCLE_COLORS[item.muscle] }}
            />
          </span>
          <span className="muscle-bar-count">{item.sets}</span>
        </div>
      ))}
    </div>
  );
}
