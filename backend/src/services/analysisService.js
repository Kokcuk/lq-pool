import { fetchPools, fetchPriceHistory } from '../clients/defiLlamaClient.js';
import { toChainSlug } from './poolService.js';
import { InvalidParamError, PoolNotFoundError } from '../middleware/errorHandler.js';

// Risk tolerance (1–10) → confidence level (%)
const CONFIDENCE = [0, 99, 97, 95, 93, 90, 87, 83, 80, 75, 70];

export async function analyze(poolId, risk) {
  if (risk < 1 || risk > 10) {
    throw new InvalidParamError('risk must be 1-10');
  }

  const raw = await fetchPools();
  const pool = raw.find(p => p.pool === poolId);
  if (!pool) throw new PoolNotFoundError(poolId);

  const tokens = pool.underlyingTokens;
  if (!tokens || tokens.length < 2) {
    throw new PoolNotFoundError(`${poolId} (no underlying token addresses available)`);
  }

  const chainSlug = toChainSlug(pool.chain);
  const coinKey0 = `${toDeFiLlamaCoinsChain(chainSlug)}:${tokens[0].toLowerCase()}`;
  const coinKey1 = `${toDeFiLlamaCoinsChain(chainSlug)}:${tokens[1].toLowerCase()}`;

  const [prices0, prices1] = await Promise.all([
    fetchPriceHistory(coinKey0),
    fetchPriceHistory(coinKey1),
  ]);

  if (prices0.length === 0 || prices1.length === 0) {
    throw new PoolNotFoundError(`${poolId} (price history unavailable)`);
  }

  const ratioSeries = computeRatioSeries(prices0, prices1);
  if (ratioSeries.length === 0) {
    throw new PoolNotFoundError(`${poolId} (could not compute price ratio series)`);
  }

  const currentPrice = ratioSeries[ratioSeries.length - 1].price;
  const confidenceLevel = CONFIDENCE[risk];

  const priceValues = ratioSeries.map(p => p.price);
  const sorted = [...priceValues].sort((a, b) => a - b);

  const lowerTail = (1.0 - confidenceLevel / 100.0) / 2.0;
  const upperTail = 1.0 - lowerTail;
  const lowerPrice = percentile(sorted, lowerTail);
  const upperPrice = percentile(sorted, upperTail);
  const spreadPercent = (upperPrice - lowerPrice) / currentPrice * 100;

  const ilAtLower = classicIL(lowerPrice / currentPrice) * 100;
  const ilAtUpper = classicIL(upperPrice / currentPrice) * 100;

  const volatilityMetrics = computeVolatilityMetrics(priceValues, lowerPrice, upperPrice);

  return {
    poolId,
    currentPrice,
    riskTolerance: risk,
    confidenceLevel,
    priceWindow: { lowerPrice, upperPrice, spreadPercent },
    ilAtLower,
    ilAtUpper,
    volatilityMetrics,
    priceHistory: ratioSeries,
  };
}

function computeRatioSeries(prices0, prices1) {
  // Align by day (timestamps from DeFiLlama differ by seconds between tokens)
  const dayOf = ts => Math.floor(ts / 86400);
  const map1 = new Map();
  for (const p of prices1) {
    map1.set(dayOf(p.timestamp), p.price);
  }
  const result = [];
  for (const p0 of prices0) {
    const p1 = map1.get(dayOf(p0.timestamp));
    if (p1 && p1 !== 0) {
      result.push({ timestamp: p0.timestamp, price: p0.price / p1 });
    }
  }
  return result;
}

function percentile(sorted, quantile) {
  if (sorted.length === 0) return 0;
  const pos = quantile * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, sorted.length - 1);
  const frac = pos - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

function classicIL(r) {
  // IL = 2*sqrt(r)/(1+r) - 1  (negative value means loss)
  return 2 * Math.sqrt(r) / (1 + r) - 1;
}

function computeVolatilityMetrics(prices, lower, upper) {
  const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
  const variance = prices.reduce((s, p) => s + (p - mean) ** 2, 0) / prices.length;
  const stdDev = Math.sqrt(variance) / mean * 100;

  let maxDrawdown = 0;
  let peak = prices[0];
  for (const price of prices) {
    if (price > peak) peak = price;
    const drawdown = (peak - price) / peak * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const inRange = prices.filter(p => p >= lower && p <= upper).length;
  const percentInRange = inRange / prices.length * 100;

  return { stdDev1y: stdDev, maxDrawdown1y: maxDrawdown, percentInRange };
}

function toDeFiLlamaCoinsChain(slug) {
  switch (slug) {
    case 'avalanche': return 'avax';
    default: return slug;
  }
}
