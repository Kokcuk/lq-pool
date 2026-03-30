import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Platform, PoolsResponse, SortField, SortOrder } from '../types';
import { fetchPlatforms, fetchPools } from '../api/pools';
import FilterBar from '../components/FilterBar';
import PoolTable from '../components/PoolTable';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';

const LIMIT = 50;

export default function PoolExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedPlatform = searchParams.get('platform') ?? '';
  const selectedChain = searchParams.get('chain') ?? '';
  const sort = (searchParams.get('sort') as SortField) ?? 'score';
  const order = (searchParams.get('order') as SortOrder) ?? 'desc';
  const offset = Number(searchParams.get('offset') ?? 0);

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [result, setResult] = useState<PoolsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatforms().then(setPlatforms).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPools({
        platform: selectedPlatform || undefined,
        chain: selectedChain || undefined,
        sort,
        order,
        limit: LIMIT,
        offset,
      });
      setResult(data);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to load pools.');
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform, selectedChain, sort, order, offset]);

  useEffect(() => { load(); }, [load]);

  function updateParams(patch: Record<string, string | undefined>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') next.delete(k);
        else next.set(k, v);
      }
      return next;
    });
  }

  function handlePlatformChange(value: string) {
    updateParams({ platform: value || undefined, chain: undefined, offset: undefined });
  }

  function handleChainChange(value: string) {
    updateParams({ chain: value || undefined, offset: undefined });
  }

  function handleSort(field: SortField) {
    const newOrder: SortOrder =
      sort === field && order === 'desc' ? 'asc' : 'desc';
    updateParams({ sort: field, order: newOrder, offset: undefined });
  }

  function handlePage(newOffset: number) {
    updateParams({ offset: newOffset > 0 ? String(newOffset) : undefined });
  }

  return (
    <main style={{ padding: '16px 24px', minWidth: 1024 }}>
      <FilterBar
        platforms={platforms}
        selectedPlatform={selectedPlatform}
        selectedChain={selectedChain}
        disabled={loading}
        onPlatformChange={handlePlatformChange}
        onChainChange={handleChainChange}
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <Spinner />
      ) : result && result.pools.length === 0 ? (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: 48, fontSize: 15 }}>
          No pools match your filters. Try broadening your selection.
        </div>
      ) : result ? (
        <>
          <PoolTable pools={result.pools} sort={sort} order={order} onSort={handleSort} />
          <Pagination total={result.total} offset={offset} limit={LIMIT} onPageChange={handlePage} />
        </>
      ) : null}
    </main>
  );
}
