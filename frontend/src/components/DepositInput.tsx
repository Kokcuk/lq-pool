import { useState } from 'react';

interface Props {
  onCalculate: (deposit: number) => void;
  loading: boolean;
}

export default function DepositInput({ onCalculate, loading }: Props) {
  const [value, setValue] = useState('');
  const numValue = Number(value);
  const valid = value !== '' && numValue > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (valid) onCalculate(numValue);
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Deposit Amount</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, color: '#6b7280' }}>$</span>
        <input
          type="number"
          min={1}
          step="any"
          placeholder="e.g. 10000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            fontSize: 14,
          }}
        />
        <button type="submit" disabled={!valid || loading}>
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </form>
    </div>
  );
}
