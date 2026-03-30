import type { VolatilityMetrics } from '../types';
import { formatPercent } from '../utils/format';

interface Props {
  metrics: VolatilityMetrics;
}

export default function VolatilityStats({ metrics }: Props) {
  return (
    <div style={{ display: 'flex', gap: 40, padding: '16px 0', marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
      <Stat label="1Y Std Dev" value={formatPercent(metrics.stdDev1y)} />
      <Stat label="Max Drawdown" value={formatPercent(metrics.maxDrawdown1y)} color="#dc2626" />
      <Stat label="Days in range" value={formatPercent(metrics.percentInRange)} color={metrics.percentInRange > 80 ? '#16a34a' : undefined} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}
