export default function Sparkline({ points, width = 220, height = 56 }: { points: { label: string; score: number }[]; width?: number; height?: number }) {
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.score), 100);
  const min = Math.min(...points.map((p) => p.score), 0);
  const range = max - min || 1;
  const stepX = width / (points.length - 1 || 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p.score - min) / range) * height;
    return { x, y, ...p };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  return (
    <svg width={width} height={height + 20} className="sparkline">
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />
      {coords.map((c) => (
        <circle key={c.label} cx={c.x} cy={c.y} r={3} fill="var(--accent)" />
      ))}
      <text x={0} y={height + 16} className="sparkline-label">
        {points[0].label}
      </text>
      <text x={width} y={height + 16} className="sparkline-label" textAnchor="end">
        {points[points.length - 1].label}
      </text>
    </svg>
  );
}
