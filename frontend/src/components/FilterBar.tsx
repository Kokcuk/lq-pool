import type { Platform } from '../types';

interface Props {
  platforms: Platform[];
  selectedPlatform: string;
  selectedChain: string;
  disabled: boolean;
  onPlatformChange: (value: string) => void;
  onChainChange: (value: string) => void;
}

export default function FilterBar({
  platforms,
  selectedPlatform,
  selectedChain,
  disabled,
  onPlatformChange,
  onChainChange,
}: Props) {
  const chains = selectedPlatform
    ? platforms.find((p) => p.id === selectedPlatform)?.chains ?? []
    : Array.from(new Set(platforms.flatMap((p) => p.chains))).sort();

  return (
    <div style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
        Platform
        <select
          value={selectedPlatform}
          onChange={(e) => onPlatformChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">All</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
        Chain
        <select
          value={selectedChain}
          onChange={(e) => onChainChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">All</option>
          {chains.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
