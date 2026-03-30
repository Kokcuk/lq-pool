import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import type { Pool, PoolAnalysis as PoolAnalysisType } from '../types';
import { fetchPoolAnalysis } from '../api/pools';
import PoolHeader from '../components/PoolHeader';
import RiskSlider from '../components/RiskSlider';
import PriceWindowCard from '../components/PriceWindowCard';
import PriceChart from '../components/PriceChart';
import VolatilityStats from '../components/VolatilityStats';
import DepositInput from '../components/DepositInput';
import ReturnsCard from '../components/ReturnsCard';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';

export default function PoolAnalysis() {
  const { poolId } = useParams<{ poolId: string }>();
  const location = useLocation();

  const pool = (location.state as { pool?: Pool } | null)?.pool ?? null;

  const [analysis, setAnalysis] = useState<PoolAnalysisType | null>(null);
  const [risk, setRisk] = useState(5);
  const [deposit, setDeposit] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [sliderLoading, setSliderLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decodedId = poolId ? decodeURIComponent(poolId) : '';

  const loadAnalysis = useCallback(async (riskValue: number, depositValue?: number) => {
    if (!decodedId) return;
    setError(null);
    try {
      const data = await fetchPoolAnalysis(decodedId, riskValue, depositValue);
      setAnalysis(data);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to load analysis.');
    }
  }, [decodedId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    loadAnalysis(risk).finally(() => setLoading(false));
  }, [decodedId]);

  async function handleRiskCommit(value: number) {
    setRisk(value);
    setSliderLoading(true);
    await loadAnalysis(value, deposit);
    setSliderLoading(false);
  }

  async function handleCalculate(value: number) {
    setDeposit(value);
    setDepositLoading(true);
    await loadAnalysis(risk, value);
    setDepositLoading(false);
  }

  // Build pair name from analysis response if no pool from nav state
  const pairName = analysis ? analysis.poolId : undefined;

  return (
    <main style={{ padding: '16px 24px', minWidth: 1024, maxWidth: 900 }}>
      <Link to="/" style={{ display: 'inline-block', marginBottom: 20, fontSize: 14 }}>
        &larr; Back to pools
      </Link>

      <PoolHeader pool={pool} pairName={pairName} />

      <RiskSlider value={risk} loading={sliderLoading} onCommit={handleRiskCommit} />

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => {
            setLoading(true);
            loadAnalysis(risk, deposit).finally(() => setLoading(false));
          }}
        />
      )}

      {loading ? (
        <Spinner />
      ) : analysis ? (
        <>
          <PriceWindowCard analysis={analysis} />
          <PriceChart
            priceHistory={analysis.priceHistory}
            currentPrice={analysis.currentPrice}
            priceWindow={analysis.priceWindow}
          />
          <VolatilityStats metrics={analysis.volatilityMetrics} />
          <DepositInput onCalculate={handleCalculate} loading={depositLoading} />
          {analysis.returns && <ReturnsCard returns={analysis.returns} />}
        </>
      ) : null}
    </main>
  );
}
