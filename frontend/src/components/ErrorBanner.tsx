interface Props {
  message: string;
  onRetry: () => void;
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div style={styles.banner}>
      <span>{message}</span>
      <button style={styles.btn} onClick={onRetry}>Retry</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    background: '#3b0a0a',
    border: '1px solid #7f1d1d',
    color: '#fca5a5',
    padding: '12px 16px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  btn: {
    background: '#7f1d1d',
    color: '#fca5a5',
    border: 'none',
    padding: '4px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
  },
};
