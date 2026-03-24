import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import type { Pool, PoolAnalysis as PoolAnalysisType } from '../types';
import { fetchPools, fetchPoolAnalysis } from '../api/pools';
import PoolHeader from '../components/PoolHeader';
import RiskSlider from '../components/RiskSlider';
import PriceWindowCard from '../components/PriceWindowCard';
import PriceChart from '../components/PriceChart';
import VolatilityStats from '../components/VolatilityStats';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';

export default function PoolAnalysis() {
  const { poolId } = useParams<{ poolId: string }>();
  const location = useLocation();

  const [pool, setPool] = useState<Pool | null>(null);
  const [analysis, setAnalysis] = useState<PoolAnalysisType | null>(null);
  const [risk, setRisk] = useState(5);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decodedId = poolId ? decodeURIComponent(poolId) : '';

  // Load pool metadata once
  useEffect(() => {
    if (!decodedId) return;
    fetchPools({ limit: 1, offset: 0 })
      .then((res) => {
        // Try to find the pool in results; if not found leave null (header will be skipped)
        const found = res.pools.find((p) => p.id === decodedId) ?? null;
        setPool(found);
      })
      .catch(() => setPool(null));
  }, [decodedId]);

  const loadAnalysis = useCallback(async (riskValue: number) => {
    if (!decodedId) return;
    setError(null);
    try {
      const data = await fetchPoolAnalysis(decodedId, riskValue);
      setAnalysis(data);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to load analysis.');
    }
  }, [decodedId]);

  // Initial full load
  useEffect(() => {
    setLoading(true);
    loadAnalysis(risk).finally(() => setLoading(false));
  }, [decodedId]);

  // Debounced slider re-fetch
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleRiskChange(value: number) {
    setRisk(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setAnalysisLoading(true);
      await loadAnalysis(value);
      setAnalysisLoading(false);
    }, 400);
  }

  const backSearch = location.state?.search ?? '';

  return (
    <main style={styles.main}>
      <Link to={`/${backSearch}`} style={styles.back}>← Back to pools</Link>

      {pool && <PoolHeader pool={pool} />}

      <RiskSlider value={risk} disabled={loading || analysisLoading} onChange={handleRiskChange} />

      {error && <ErrorBanner message={`Failed to load analysis. ${error}`} onRetry={() => {
        setLoading(true);
        loadAnalysis(risk).finally(() => setLoading(false));
      }} />}

      {loading ? (
        <Spinner />
      ) : analysis ? (
        <>
          <div style={styles.analysisWrap}>
            {analysisLoading && <div style={styles.inlineSpinner}><span style={styles.spinner} /></div>}
            <PriceWindowCard analysis={analysis} />
          </div>
          <PriceChart
            priceHistory={analysis.priceHistory}
            currentPrice={analysis.currentPrice}
            priceWindow={analysis.priceWindow}
          />
          <VolatilityStats metrics={analysis.volatilityMetrics} />
        </>
      ) : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    padding: '16px 24px',
    minWidth: 1024,
    maxWidth: 900,
  },
  back: {
    display: 'inline-block',
    marginBottom: 20,
    color: '#6366f1',
    textDecoration: 'none',
    fontSize: 14,
  },
  analysisWrap: {
    position: 'relative',
  },
  inlineSpinner: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  spinner: {
    display: 'inline-block',
    width: 18,
    height: 18,
    border: '2px solid #2d2d4e',
    borderTop: '2px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
