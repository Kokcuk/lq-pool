import type { Platform } from '../types';

interface Props {
  platforms: Platform[];
  selectedPlatforms: string[];
  selectedChains: string[];
  disabled: boolean;
  onPlatformChange: (values: string[]) => void;
  onChainChange: (values: string[]) => void;
}

export default function FilterBar({
  platforms,
  selectedPlatforms,
  selectedChains,
  disabled,
  onPlatformChange,
  onChainChange,
}: Props) {
  const allChains = Array.from(
    new Set(platforms.flatMap((p) => p.chains))
  ).sort();

  function handlePlatform(e: React.ChangeEvent<HTMLSelectElement>) {
    const vals = Array.from(e.target.selectedOptions, (o) => o.value).filter(Boolean);
    onPlatformChange(vals);
  }

  function handleChain(e: React.ChangeEvent<HTMLSelectElement>) {
    const vals = Array.from(e.target.selectedOptions, (o) => o.value).filter(Boolean);
    onChainChange(vals);
  }

  return (
    <div style={styles.bar}>
      <label style={styles.label}>
        Platform
        <select
          multiple
          value={selectedPlatforms}
          onChange={handlePlatform}
          disabled={disabled}
          style={styles.select}
        >
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span style={styles.hint}>Hold Ctrl/Cmd to multi-select</span>
      </label>
      <label style={styles.label}>
        Chain
        <select
          multiple
          value={selectedChains}
          onChange={handleChain}
          disabled={disabled}
          style={styles.select}
        >
          {allChains.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span style={styles.hint}>Hold Ctrl/Cmd to multi-select</span>
      </label>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    gap: 24,
    padding: '12px 0',
    borderBottom: '1px solid #2d2d4e',
    marginBottom: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: 500,
  },
  select: {
    background: '#1e1e38',
    color: '#e2e8f0',
    border: '1px solid #2d2d4e',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 13,
    minWidth: 160,
    height: 80,
  },
  hint: {
    fontSize: 11,
    color: '#475569',
  },
};
