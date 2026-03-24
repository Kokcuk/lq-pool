export default function Spinner() {
  return (
    <div style={styles.wrap}>
      <div style={styles.spinner} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #2d2d4e',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
