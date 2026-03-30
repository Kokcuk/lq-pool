import type { Returns, ReturnEstimate } from '../types';
import { formatCurrency, compactNumber } from '../utils/format';

interface Props {
  returns: Returns;
}

const PERIODS: { key: 'daily' | 'weekly' | 'monthly' | 'yearly'; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

function fmtDollar(v: number): string {
  if (Math.abs(v) >= 1000) return compactNumber(Math.abs(v));
  return formatCurrency(Math.abs(v));
}

function EstCell({ est, prefix }: { est: ReturnEstimate; prefix: '' | '-' }) {
  return (
    <>
      <td style={{ textAlign: 'right', color: '#16a34a' }}>{fmtDollar(est.feeIncome)}</td>
      <td style={{ textAlign: 'right', color: '#dc2626' }}>{prefix}${Math.abs(est.ilCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style={{ textAlign: 'right', color: est.netReturn >= 0 ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
        {fmtDollar(est.netReturn)} ({est.netReturnPercent.toFixed(2)}%)
      </td>
    </>
  );
}

export default function ReturnsCard({ returns }: Props) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Estimated Returns</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle} rowSpan={2}></th>
              <th style={{ ...thStyle, textAlign: 'center' }} colSpan={3}>Historical</th>
              <th style={{ ...thStyle, textAlign: 'center' }} colSpan={3}>Projected</th>
            </tr>
            <tr>
              <th style={thStyle}>Fees</th>
              <th style={thStyle}>IL</th>
              <th style={thStyle}>Net</th>
              <th style={thStyle}>Fees</th>
              <th style={thStyle}>IL</th>
              <th style={thStyle}>Net</th>
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(({ key, label }) => (
              <tr key={key}>
                <td style={{ padding: '8px 12px', fontWeight: 500 }}>{label}</td>
                <EstCell est={returns.historical[key]} prefix="-" />
                <EstCell est={returns.projected[key]} prefix="-" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: '8px 12px',
  fontWeight: 600,
  color: '#6b7280',
  fontSize: 12,
  textTransform: 'uppercase',
  borderBottom: '1px solid #e5e7eb',
};
