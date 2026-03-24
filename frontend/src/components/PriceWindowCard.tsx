import type { PoolAnalysis } from '../types';
import { formatPrice } from '../utils/format';

interface Props {
  analysis: PoolAnalysis;
}

export default function PriceWindowCard({ analysis }: Props) {
  const { currentPrice, confidenceLevel, priceWindow, ilAtLower, ilAtUpper } = analysis;
  const risk = analysis.riskTolerance;
  const borderColor = risk <= 3 ? '#22c55e' : risk <= 6 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ ...styles.card, borderColor }}>
      <div style={styles.row}>
        <span style={styles.label}>Current Price</span>
        <span style={styles.value}>${formatPrice(currentPrice)}</span>
      </div>
      <div style={styles.divider} />
      <h3 style={styles.heading}>Recommended Price Window</h3>
      <div style={styles.row}>
        <span style={styles.label}>Lower Bound</span>
        <span style={styles.value}>${formatPrice(priceWindow.lowerPrice)}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Upper Bound</span>
        <span style={styles.value}>${formatPrice(priceWindow.upperPrice)}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Spread</span>
        <span style={styles.value}>±{(priceWindow.spreadPercent / 2).toFixed(1)}%</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Confidence</span>
        <span style={styles.value}>{confidenceLevel}% of historical prices</span>
      </div>
      <div style={styles.divider} />
      <div style={styles.row}>
        <span style={styles.label}>Est. IL at lower bound</span>
        <span style={{ ...styles.value, color: '#f87171' }}>{ilAtLower.toFixed(1)}%</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>Est. IL at upper bound</span>
        <span style={{ ...styles.value, color: '#f87171' }}>{ilAtUpper.toFixed(1)}%</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#1e1e38',
    border: '1px solid',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 20,
  },
  heading: {
    margin: '0 0 12px',
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 600,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
  },
  label: {
    color: '#64748b',
    fontSize: 13,
  },
  value: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: 500,
  },
  divider: {
    borderTop: '1px solid #2d2d4e',
    margin: '10px 0',
  },
};
