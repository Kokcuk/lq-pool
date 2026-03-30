import { useState } from 'react';

interface Props {
  message: string;
  onRetry: () => void;
}

export default function ErrorBanner({ message, onRetry }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div style={{
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      padding: '12px 16px',
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onRetry} style={{
        background: '#ffffff',
        border: '1px solid #fecaca',
        color: '#991b1b',
        padding: '4px 12px',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 13,
      }}>Retry</button>
      <button onClick={() => setDismissed(true)} style={{
        background: 'none',
        border: 'none',
        color: '#991b1b',
        cursor: 'pointer',
        fontSize: 16,
        padding: '0 4px',
      }}>&times;</button>
    </div>
  );
}
