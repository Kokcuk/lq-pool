interface Props {
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

export default function RiskSlider({ value, disabled, onChange }: Props) {
  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.title}>Risk Tolerance</span>
        <span style={styles.value}>{value}</span>
      </div>
      <div style={styles.sliderRow}>
        <span style={styles.labelLeft}>Safe</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          style={styles.slider}
        />
        <span style={styles.labelRight}>Max Yield</span>
      </div>
      <div style={styles.ticks}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i + 1} style={styles.tick}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background: '#1e1e38',
    border: '1px solid #2d2d4e',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 20,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: 14,
  },
  value: {
    color: '#818cf8',
    fontWeight: 700,
    fontSize: 16,
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  slider: {
    flex: 1,
    accentColor: '#6366f1',
    cursor: 'pointer',
  },
  labelLeft: {
    fontSize: 12,
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  labelRight: {
    fontSize: 12,
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  ticks: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingLeft: 44,
    paddingRight: 64,
  },
  tick: {
    fontSize: 11,
    color: '#475569',
  },
};
