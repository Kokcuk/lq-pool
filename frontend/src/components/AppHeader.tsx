export default function AppHeader() {
  return (
    <header style={styles.header}>
      <span style={styles.title}>LQ-Pool</span>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    background: '#1a1a2e',
    padding: '0 24px',
    height: 52,
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #2d2d4e',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
};
