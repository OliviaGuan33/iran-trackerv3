type Props = { values: number[] };

export function Sparkline({ values }: Props) {
  if (!values.length) return null;
  const width = 240;
  const height = 72;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} />
    </svg>
  );
}
