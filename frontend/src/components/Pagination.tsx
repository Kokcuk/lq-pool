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
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '16px 0', alignItems: 'center' }}>
      <button disabled={currentPage === 1} onClick={() => onPageChange(offset - limit)}>
        &lt; Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} style={{ color: '#6b7280', padding: '0 4px' }}>...</span>
        ) : (
          <button
            key={p}
            style={p === currentPage ? { background: '#2563eb', color: '#fff', borderColor: '#2563eb' } : undefined}
            onClick={() => onPageChange((p - 1) * limit)}
          >
            {p}
          </button>
        )
      )}
      <button disabled={currentPage === totalPages} onClick={() => onPageChange(offset + limit)}>
        Next &gt;
      </button>
    </div>
  );
}
