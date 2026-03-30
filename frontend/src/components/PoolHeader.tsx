import type { Pool } from '../types';
import { compactNumber, formatPercent } from '../utils/format';

const PLATFORM_NAMES: Record<string, string> = {
  'uniswap-v3': 'Uniswap v3',
};

interface Props {
  pool?: Pool | null;
  pairName?: string;
}

export default function PoolHeader({ pool, pairName }: Props) {
  const pair = pool ? `${pool.token0.symbol} / ${pool.token1.symbol}` : pairName ?? '';

  return (
    <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700 }}>{pair}</h1>
      {pool && (
        <>
          <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>
            {PLATFORM_NAMES[pool.platform] ?? pool.platform} &middot;{' '}
            {pool.chain.charAt(0).toUpperCase() + pool.chain.slice(1)} &middot; Fee: {pool.feeTier}%
          </p>
          <div style={{ display: 'flex', gap: 32 }}>
            <Metric label="TVL" value={compactNumber(pool.tvl)} />
            <Metric label="24h Vol" value={compactNumber(pool.volume24h)} />
            <Metric label="Fee APR" value={formatPercent(pool.feeApr)} />
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
