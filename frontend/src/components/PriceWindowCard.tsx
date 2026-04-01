import { useState, useEffect } from 'react';
import type { PoolAnalysis } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  analysis: PoolAnalysis;
  onRangeChange: (lower: number, upper: number) => void;
  loading: boolean;
}

export default function PriceWindowCard({ analysis, onRangeChange, loading }: Props) {
  const { currentPrice, confidenceLevel, priceWindow, ilAtLower } = analysis;

  const [lower, setLower] = useState(String(priceWindow.lowerPrice));
  const [upper, setUpper] = useState(String(priceWindow.upperPrice));
  const [editing, setEditing] = useState(false);

  // Sync inputs when analysis updates from outside (risk slider change, etc.)
  useEffect(() => {
    setLower(String(priceWindow.lowerPrice));
    setUpper(String(priceWindow.upperPrice));
    setEditing(false);
  }, [priceWindow.lowerPrice, priceWindow.upperPrice]);

  const lowerNum = Number(lower);
  const upperNum = Number(upper);
  const valid = lowerNum > 0 && upperNum > lowerNum;
  const changed = lowerNum !== priceWindow.lowerPrice || upperNum !== priceWindow.upperPrice;

  function handleApply() {
    if (valid && changed) {
      onRangeChange(lowerNum, upperNum);
    }
  }

  function handleReset() {
    onRangeChange(0, 0); // signals "use auto"
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && valid && changed) handleApply();
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: '#6b7280', fontSize: 13 }}>Current Price</span>
        <span style={{ fontWeight: 500 }}>{formatCurrency(currentPrice)}</span>
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          Price Range
          {priceWindow.isCustomRange && (
            <span style={{ fontWeight: 400, color: '#d97706', fontSize: 12, marginLeft: 8 }}>Custom</span>
          )}
        </h3>
        {priceWindow.isCustomRange && (
          <button
            onClick={handleReset}
            disabled={loading}
            style={{
              background: 'none', border: 'none', color: '#6b7280',
              fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Reset to auto
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 8 }}>
        <PriceInput
          label="Lower"
          value={lower}
          onChange={(v) => { setLower(v); setEditing(true); }}
          onKeyDown={handleKeyDown}
        />
        <PriceInput
          label="Upper"
          value={upper}
          onChange={(v) => { setUpper(v); setEditing(true); }}
          onKeyDown={handleKeyDown}
        />
        {editing && changed && (
          <button
            onClick={handleApply}
            disabled={!valid || loading}
            style={{ height: 34, padding: '0 16px', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Updating...' : 'Apply'}
          </button>
        )}
      </div>

      {!valid && editing && (
        <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 4 }}>
          Upper price must be greater than lower price
        </div>
      )}

      <Row label="Spread" value={`\u00B1${(priceWindow.spreadPercent / 2).toFixed(1)}%`} />
      {!priceWindow.isCustomRange && (
        <Row label="Confidence" value={`${confidenceLevel}% of historical prices stayed in this range`} />
      )}
      <div style={{ borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />
      <Row
        label="Est. IL at boundary"
        value={`${ilAtLower.toFixed(1)}%`}
        valueColor={ilAtLower < -5 ? '#dc2626' : undefined}
      />
    </div>
  );
}

function PriceInput({ label, value, onChange, onKeyDown }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <input
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          padding: '6px 10px',
          border: '1px solid #d1d5db',
          borderRadius: 4,
          fontSize: 14,
          boxSizing: 'border-box',
        }}
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
