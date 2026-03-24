import { useNavigate } from 'react-router-dom';
import type { Pool, SortField, SortOrder } from '../types';
import { compactNumber } from '../utils/format';

interface Props {
  pools: Pool[];
  sort: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
}

const SORTABLE: { field: SortField; label: string }[] = [
  { field: 'tvl', label: 'TVL' },
  { field: 'volume24h', label: '24h Volume' },
  { field: 'feeApr', label: 'Fee APR' },
  { field: 'volatility30d', label: '30d Vol' },
  { field: 'score', label: 'Score' },
];

const PLATFORM_NAMES: Record<string, string> = {
  'uniswap-v3': 'Uniswap v3',
  'sushiswap-v3': 'SushiSwap v3',
  'pancakeswap-v3': 'PancakeSwap v3',
};

export default function PoolTable({ pools, sort, order, onSort }: Props) {
  const navigate = useNavigate();

  function arrow(field: SortField) {
    if (sort !== field) return ' ↕';
    return order === 'desc' ? ' ↓' : ' ↑';
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Pair</th>
          <th style={styles.th}>Platform</th>
          <th style={styles.th}>Chain</th>
          <th style={styles.th}>Fee Tier</th>
          {SORTABLE.map(({ field, label }) => (
            <th
              key={field}
              style={{ ...styles.th, ...styles.sortable }}
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
            style={styles.row}
            onClick={() => navigate(`/pool/${encodeURIComponent(pool.id)}`)}
          >
            <td style={styles.td}>
              <strong>{pool.token0.symbol}/{pool.token1.symbol}</strong>
            </td>
            <td style={styles.td}>{PLATFORM_NAMES[pool.platform] ?? pool.platform}</td>
            <td style={styles.td}>{pool.chain}</td>
            <td style={styles.td}>{pool.feeTier}%</td>
            <td style={styles.td}>{compactNumber(pool.tvl)}</td>
            <td style={styles.td}>{compactNumber(pool.volume24h)}</td>
            <td style={styles.td}>{pool.feeApr.toFixed(1)}%</td>
            <td style={styles.td}>{pool.volatility30d.toFixed(1)}%</td>
            <td style={{ ...styles.td, ...styles.score }}>{pool.score}/100</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    color: '#64748b',
    borderBottom: '1px solid #2d2d4e',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  sortable: {
    cursor: 'pointer',
    color: '#94a3b8',
  },
  row: {
    cursor: 'pointer',
    borderBottom: '1px solid #1e1e38',
  },
  td: {
    padding: '10px 12px',
    color: '#cbd5e1',
    whiteSpace: 'nowrap',
  },
  score: {
    color: '#818cf8',
    fontWeight: 600,
  },
};
