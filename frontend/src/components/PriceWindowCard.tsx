import type { PoolAnalysis } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  analysis: PoolAnalysis;
}

export default function PriceWindowCard({ analysis }: Props) {
  const { currentPrice, confidenceLevel, priceWindow, ilAtLower } = analysis;

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: '#6b7280', fontSize: 13 }}>Current Price</span>
        <span style={{ fontWeight: 500 }}>{formatCurrency(currentPrice)}</span>
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Recommended Price Window</h3>
      <Row label="Lower" value={formatCurrency(priceWindow.lowerPrice)} />
      <Row label="Upper" value={formatCurrency(priceWindow.upperPrice)} />
      <Row label="Spread" value={`\u00B1${(priceWindow.spreadPercent / 2).toFixed(1)}%`} />
      <Row label="Confidence" value={`${confidenceLevel}% of historical prices stayed in this range`} />
      <div style={{ borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />
      <Row
        label="Est. IL at boundary"
        value={`${ilAtLower.toFixed(1)}%`}
        valueColor={ilAtLower < -5 ? '#dc2626' : undefined}
      />
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
      <span style={{ color: '#6b7280', fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: valueColor }}>{value}</span>
    </div>
  );
}
