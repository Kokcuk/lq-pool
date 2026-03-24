import type { Pool } from '../types';
import { compactNumber } from '../utils/format';

const PLATFORM_NAMES: Record<string, string> = {
  'uniswap-v3': 'Uniswap v3',
  'sushiswap-v3': 'SushiSwap v3',
  'pancakeswap-v3': 'PancakeSwap v3',
};

interface Props {
  pool: Pool;
}

export default function PoolHeader({ pool }: Props) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.pair}>{pool.token0.symbol} / {pool.token1.symbol}</h1>
      <p style={styles.sub}>
        {PLATFORM_NAMES[pool.platform] ?? pool.platform} · {pool.chain} · Fee: {pool.feeTier}%
      </p>
      <div style={styles.metrics}>
        <Metric label="TVL" value={compactNumber(pool.tvl)} />
        <Metric label="24h Vol" value={compactNumber(pool.volume24h)} />
        <Metric label="Fee APR" value={`${pool.feeApr.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metric}>
      <span style={styles.metricLabel}>{label}</span>
      <span style={styles.metricValue}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottom: '1px solid #2d2d4e',
  },
  pair: {
    margin: '0 0 4px',
    fontSize: 26,
    color: '#e2e8f0',
    fontWeight: 700,
  },
  sub: {
    margin: '0 0 16px',
    color: '#64748b',
    fontSize: 14,
  },
  metrics: {
    display: 'flex',
    gap: 32,
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metricValue: {
    fontSize: 18,
    color: '#e2e8f0',
    fontWeight: 600,
  },
};
