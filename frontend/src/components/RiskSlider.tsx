import { useState } from 'react';

interface Props {
  value: number;
  loading: boolean;
  onCommit: (value: number) => void;
}

export default function RiskSlider({ value, loading, onCommit }: Props) {
  const [local, setLocal] = useState(value);

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Risk Tolerance</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#2563eb' }}>{local}</span>
          {loading && (
            <span style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              border: '2px solid #e5e7eb',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }} />
          )}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Safe</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={local}
          onChange={(e) => setLocal(Number(e.target.value))}
          onPointerUp={() => { if (local !== value) onCommit(local); }}
          style={{ flex: 1, accentColor: '#2563eb', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 12, color: '#6b7280' }}>Max Yield</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, paddingLeft: 36, paddingRight: 60 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i + 1} style={{ fontSize: 11, color: '#9ca3af' }}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}
