function colorFor(score: number) {
  if (score >= 85) return "var(--good)";
  if (score >= 70) return "var(--warn)";
  return "var(--bad)";
}

export default function ScoreRing({ score, size = 96, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = colorFor(score);

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} className="ring-track" strokeWidth={8} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-ring-label">
        <strong>{score}</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}
