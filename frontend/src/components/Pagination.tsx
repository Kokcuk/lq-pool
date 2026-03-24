interface Props {
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
}

export default function Pagination({ total, offset, limit, onPageChange }: Props) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div style={styles.wrap}>
      <button
        style={styles.btn}
        disabled={currentPage === 1}
        onClick={() => onPageChange(offset - limit)}
      >
        &lt;
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} style={styles.ellipsis}>...</span>
        ) : (
          <button
            key={p}
            style={{ ...styles.btn, ...(p === currentPage ? styles.active : {}) }}
            onClick={() => onPageChange((p - 1) * limit)}
          >
            {p}
          </button>
        )
      )}
      <button
        style={styles.btn}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(offset + limit)}
      >
        &gt;
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    gap: 4,
    justifyContent: 'center',
    padding: '16px 0',
    alignItems: 'center',
  },
  btn: {
    background: '#1e1e38',
    color: '#94a3b8',
    border: '1px solid #2d2d4e',
    borderRadius: 4,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 13,
  },
  active: {
    background: '#6366f1',
    color: '#fff',
    borderColor: '#6366f1',
  },
  ellipsis: {
    color: '#475569',
    padding: '0 4px',
  },
};
