'use client';

import { DatabaseChart } from '../lib/types';

const palette = ['#5eead4', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa', '#f87171'];

function formatXAxisLabel(value: string | null) {
  if (!value) return '';
  if (value.length >= 10 && value[4] === '-') return value.slice(5, 10);
  return value;
}

function formatValue(value: number) {
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 100) return value.toFixed(1);
  if (Math.abs(value) >= 1) return value.toFixed(2);
  return value.toFixed(4);
}

function buildPath(values: Array<number | null>, width: number, height: number, min: number, max: number) {
  const range = max - min || 1;
  const commands: string[] = [];

  values.forEach((value, index) => {
    if (value === null) return;
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * (height - 20) - 10;
    commands.push(`${commands.length ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  });

  return commands.join(' ');
}

export function LineChart({ chart }: { chart: DatabaseChart }) {
  const width = 720;
  const height = 260;
  const allValues = chart.series.flatMap((item) =>
    item.values.filter((value): value is number => value !== null),
  );

  if (!allValues.length) {
    return <div className="chart-empty">当前图表没有可绘制的数值。</div>;
  }

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const labels = [
    chart.x_values[0] || '',
    chart.x_values[Math.floor(chart.x_values.length / 2)] || '',
    chart.x_values[chart.x_values.length - 1] || '',
  ];

  return (
    <div className="chart-shell">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[0, 1, 2, 3].map((row) => {
          const y = 20 + row * 60;
          return <line key={y} x1="0" y1={y} x2={width} y2={y} className="chart-grid-line" />;
        })}
        {chart.series.map((series, index) => (
          <path
            key={series.name}
            d={buildPath(series.values, width, height, min, max)}
            fill="none"
            stroke={palette[index % palette.length]}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div className="chart-axis">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}>{formatXAxisLabel(label)}</span>
        ))}
      </div>

      <div className="chart-legend">
        {chart.series.map((series, index) => (
          <div className="legend-item" key={series.name}>
            <span className="legend-dot" style={{ backgroundColor: palette[index % palette.length] }} />
            <span className="legend-name">{series.name}</span>
            <span className="legend-value">{formatValue(series.last_value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
