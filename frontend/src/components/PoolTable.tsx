import { useNavigate } from 'react-router-dom';
import type { Pool, SortField, SortOrder } from '../types';
import { compactNumber, formatPercent } from '../utils/format';

interface Props {
  pools: Pool[];
  sort: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
}

const PLATFORM_NAMES: Record<string, string> = {
  'uniswap-v3': 'Uni v3',
};

const SORTABLE: { field: SortField; label: string }[] = [
  { field: 'tvl', label: 'TVL' },
  { field: 'volume24h', label: '24h Volume' },
  { field: 'feeApr', label: 'Fee APR' },
  { field: 'volatility30d', label: '30d Vol' },
  { field: 'score', label: 'Score' },
];

export default function PoolTable({ pools, sort, order, onSort }: Props) {
  const navigate = useNavigate();

  function arrow(field: SortField) {
    if (sort !== field) return '';
    return order === 'desc' ? ' \u25BC' : ' \u25B2';
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Pair</th>
          <th>Platform</th>
          <th>Chain</th>
          <th style={{ textAlign: 'right' }}>Fee</th>
          {SORTABLE.map(({ field, label }) => (
            <th
              key={field}
              style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => onSort(field)}
            >
              {label}{arrow(field)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pools.map((pool) => (
          <tr
            key={pool.id}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            onClick={() => navigate(`/pool/${encodeURIComponent(pool.id)}`, { state: { pool } })}
          >
            <td><strong>{pool.token0.symbol} / {pool.token1.symbol}</strong></td>
            <td>{PLATFORM_NAMES[pool.platform] ?? pool.platform}</td>
            <td>{pool.chain.charAt(0).toUpperCase() + pool.chain.slice(1)}</td>
            <td style={{ textAlign: 'right' }}>{pool.feeTier}%</td>
            <td style={{ textAlign: 'right' }}>{compactNumber(pool.tvl)}</td>
            <td style={{ textAlign: 'right' }}>{compactNumber(pool.volume24h)}</td>
            <td style={{ textAlign: 'right' }}>{formatPercent(pool.feeApr)}</td>
            <td style={{ textAlign: 'right' }}>{formatPercent(pool.volatility30d)}</td>
            <td style={{ textAlign: 'right' }}>{pool.score} / 100</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
