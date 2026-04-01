import type { GasCosts } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  gasCosts: GasCosts;
  deposit: number;
  dailyNetReturn: number;
}

const CHAIN_NAMES: Record<string, string> = {
  ethereum: 'Ethereum Mainnet',
  arbitrum: 'Arbitrum',
  base: 'Base',
  optimism: 'Optimism',
  polygon: 'Polygon',
  bsc: 'BNB Chain',
  avalanche: 'Avalanche',
};

export default function GasCostsCard({ gasCosts, deposit, dailyNetReturn }: Props) {
  const chainName = CHAIN_NAMES[gasCosts.chain] ?? gasCosts.chain;
  const isHighGas = gasCosts.percentOfDeposit > 5;
  const isAbsurd = gasCosts.percentOfDeposit > 20;

  // How many days of net profit to recover gas costs
  const daysToBreakeven = dailyNetReturn > 0
    ? Math.ceil(gasCosts.total / dailyNetReturn)
    : null;

  return (
    <div style={{
      border: `1px solid ${isAbsurd ? '#fca5a5' : isHighGas ? '#fde68a' : '#e0e0e0'}`,
      borderRadius: 8,
      padding: 20,
      marginBottom: 20,
      background: isAbsurd ? '#fef2f2' : isHighGas ? '#fffbeb' : undefined,
    }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
        Estimated Gas Costs
        <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>({chainName})</span>
      </h3>

      <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
        <GasItem label="Open position" value={gasCosts.open} />
        <GasItem label="Collect fees" value={gasCosts.collect} />
        <GasItem label="Close position" value={gasCosts.close} />
        <GasItem label="Total" value={gasCosts.total} bold />
      </div>

      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
        <span>
          Gas is <strong style={{ color: isAbsurd ? '#dc2626' : isHighGas ? '#d97706' : '#374151' }}>
            {gasCosts.percentOfDeposit.toFixed(1)}%
          </strong> of your {formatCurrency(deposit)} deposit.
        </span>

        {daysToBreakeven != null && (
          <span style={{ marginLeft: 8 }}>
            You need <strong>{daysToBreakeven} day{daysToBreakeven !== 1 ? 's' : ''}</strong> of net profit just to cover gas.
          </span>
        )}
      </div>

      {isAbsurd && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: '#fee2e2',
          borderRadius: 6,
          fontSize: 13,
          color: '#991b1b',
          fontWeight: 500,
        }}>
          Gas costs eat over 20% of your deposit. Consider a larger deposit or an L2 chain.
        </div>
      )}

      {isHighGas && !isAbsurd && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: '#fef3c7',
          borderRadius: 6,
          fontSize: 13,
          color: '#92400e',
          fontWeight: 500,
        }}>
          Gas costs are significant relative to your deposit. Make sure projected returns justify the cost.
        </div>
      )}
    </div>
  );
}

function GasItem({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: bold ? 700 : 600, color: bold ? '#111827' : undefined }}>
        {value < 0.01 ? '<$0.01' : formatCurrency(value)}
      </span>
    </div>
  );
}
