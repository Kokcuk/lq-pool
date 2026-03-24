import type { VolatilityMetrics } from '../types';

interface Props {
  metrics: VolatilityMetrics;
}

export default function VolatilityStats({ metrics }: Props) {
  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>Volatility Stats</h3>
      <div style={styles.stats}>
        <Stat label="1Y Std Dev" value={`${metrics.stdDev1y.toFixed(2)}%`} />
        <Stat label="Max Drawdown" value={`${metrics.maxDrawdown1y.toFixed(1)}%`} />
        <Stat label="Days in Range" value={`${metrics.percentInRange.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.stat}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background: '#1e1e38',
    border: '1px solid #2d2d4e',
    borderRadius: 8,
    padding: '16px 20px',
  },
  title: {
    margin: '0 0 16px',
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 600,
  },
  stats: {
    display: 'flex',
    gap: 40,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: 20,
    color: '#e2e8f0',
    fontWeight: 600,
  },
};
