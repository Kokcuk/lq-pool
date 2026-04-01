import { fetchPools, fetchPriceHistory } from '../clients/defiLlamaClient.js';
import { toChainSlug } from './poolService.js';
import { InvalidParamError, PoolNotFoundError } from '../middleware/errorHandler.js';

// Risk tolerance (1–10) → confidence level (%)
const CONFIDENCE = [0, 99, 97, 95, 93, 90, 87, 83, 80, 75, 70];

export async function analyze(poolId, risk, deposit = null, customLower = null, customUpper = null) {
  if (risk < 1 || risk > 10) {
    throw new InvalidParamError('risk must be 1-10');
  }
  if (deposit != null && deposit <= 0) {
    throw new InvalidParamError('deposit must be a positive number');
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
  const autoLower = percentile(sorted, lowerTail);
  const autoUpper = percentile(sorted, upperTail);

  // Use custom range if provided, otherwise auto-calculated
  const isCustomRange = customLower != null && customUpper != null
    && customLower > 0 && customUpper > customLower;
  const Pa = isCustomRange ? customLower : autoLower;
  const Pb = isCustomRange ? customUpper : autoUpper;
  const spreadPercent = (Pb - Pa) / currentPrice * 100;

  // IL at range boundaries using concentrated liquidity formula
  const ilAtLower = concentratedIL(currentPrice, Pa, Pa, Pb) * 100;
  const ilAtUpper = concentratedIL(currentPrice, Pb, Pa, Pb) * 100;

  const volatilityMetrics = computeVolatilityMetrics(priceValues, Pa, Pb);

  const chainSlugLower = toChainSlug(pool.chain);

  const result = {
    poolId,
    chain: chainSlugLower,
    currentPrice,
    riskTolerance: risk,
    confidenceLevel,
    priceWindow: { lowerPrice: Pa, upperPrice: Pb, spreadPercent, isCustomRange },
    ilAtLower,
    ilAtUpper,
    volatilityMetrics,
    priceHistory: ratioSeries,
  };

  if (deposit != null) {
    const tvl = pool.tvlUsd ?? 0;
    const feeTierPct = parseFeeTier(pool.poolMeta);
    // Prefer 7-day average volume over single-day snapshot (less noisy)
    const volumeUsd7d = pool.volumeUsd7d ?? 0;
    const volumeUsd1d = volumeUsd7d > 0
      ? volumeUsd7d / 7
      : (pool.volumeUsd1d ?? 0);
    result.returns = computeReturns(deposit, tvl, feeTierPct, volumeUsd1d,
      ratioSeries, Pa, Pb, volatilityMetrics.percentInRange);
    result.gasCosts = estimateGasCosts(chainSlugLower, deposit);
  }

  return result;
}

// --- Gas cost estimation ---

// Average gas costs in USD per operation, per chain.
// These are ballpark estimates based on typical 2025 gas prices.
// Mainnet is expensive; L2s are near-free post-Dencun (EIP-4844).
const GAS_COSTS_USD = {
  ethereum:  { open: 30,   collect: 10,  close: 20   },
  arbitrum:  { open: 0.12, collect: 0.05, close: 0.10 },
  base:      { open: 0.10, collect: 0.04, close: 0.08 },
  optimism:  { open: 0.12, collect: 0.05, close: 0.10 },
  polygon:   { open: 0.02, collect: 0.01, close: 0.02 },
  bsc:       { open: 0.30, collect: 0.10, close: 0.20 },
  avalanche: { open: 0.25, collect: 0.08, close: 0.15 },
};
const DEFAULT_GAS = { open: 5, collect: 2, close: 4 };

function estimateGasCosts(chain, deposit) {
  const costs = GAS_COSTS_USD[chain] ?? DEFAULT_GAS;
  const total = round2(costs.open + costs.collect + costs.close);
  const percentOfDeposit = round2(total / deposit * 100);
  return {
    chain,
    open: round2(costs.open),
    collect: round2(costs.collect),
    close: round2(costs.close),
    total,
    percentOfDeposit,
  };
}

// --- Concentrated liquidity math ---

// Liquidity units from deposit at price P0 with range [Pa, Pb]
function liquidityFromDeposit(deposit, P0, Pa, Pb) {
  const sqP0 = Math.sqrt(P0);
  const sqPa = Math.sqrt(Pa);
  const sqPb = Math.sqrt(Pb);
  return deposit / (sqP0 * (sqPb - sqP0) / sqPb + (sqP0 - sqPa));
}

// Position value at price P given liquidity L and range [Pa, Pb]
function positionValue(L, P, Pa, Pb) {
  const sqPa = Math.sqrt(Pa);
  const sqPb = Math.sqrt(Pb);
  if (P <= Pa) {
    // Below range — 100% token1
    return L * (sqPa - sqPa * sqPa / sqPb + (sqPa - sqPa));
    // Simplified: all value in token1 at boundary
  }
  if (P >= Pb) {
    // Above range — 100% token0
    return L * (sqPb - sqPa);
  }
  // In range
  const sqP = Math.sqrt(P);
  return L * (sqP * (sqPb - sqP) / sqPb + (sqP - sqPa));
}

// Hold value: if you just held the tokens instead of LP-ing
function holdValue(L, P0, P, Pa, Pb) {
  const sqP0 = Math.sqrt(P0);
  const sqPa = Math.sqrt(Pa);
  const sqPb = Math.sqrt(Pb);
  // Token amounts at entry price P0
  const x0 = L * (sqPb - sqP0) / (sqP0 * sqPb); // amount of token0
  const y0 = L * (sqP0 - sqPa);                   // amount of token1
  return x0 * P + y0;
}

// Concentrated liquidity IL: returns negative value (loss)
function concentratedIL(P0, P, Pa, Pb) {
  if (Pa >= Pb || P0 <= 0) return 0;
  const L = liquidityFromDeposit(1, P0, Pa, Pb); // unit deposit
  const vPos = positionValue(L, P, Pa, Pb);
  const vHold = holdValue(L, P0, P, Pa, Pb);
  if (vHold === 0) return 0;
  return (vPos - vHold) / vHold;
}

// --- Returns calculation ---

function computeReturns(deposit, tvl, feeTierPct, volumeUsd1d, ratioSeries, Pa, Pb, percentInRange) {
  const currentPrice = ratioSeries[ratioSeries.length - 1].price;
  const userShare = deposit / (tvl + deposit);

  // Historical: day-by-day simulation using actual prices
  function historicalPeriod(days) {
    const slice = ratioSeries.slice(-Math.max(days, 2));
    if (slice.length < 2) return zeroPeriod();

    const P0 = slice[0].price;
    let feeIncome = 0;

    for (const pt of slice) {
      const Pi = pt.price;
      if (Pi >= Pa && Pi <= Pb) {
        // In range — LP earns fees proportional to TVL share
        feeIncome += userShare * volumeUsd1d * (feeTierPct / 100);
      }
      // Out of range — earns nothing
    }

    // IL over the period
    const Pend = slice[slice.length - 1].price;
    const il = concentratedIL(P0, Pend, Pa, Pb);
    const ilCost = deposit * Math.abs(il);

    const netReturn = feeIncome - ilCost;
    return {
      feeIncome: round2(feeIncome),
      ilCost: round2(ilCost),
      netReturn: round2(netReturn),
      netReturnPercent: round2(netReturn / deposit * 100),
    };
  }

  // Projected: based on time-in-range % and volume averages
  function projectedPeriod(days) {
    const yearlyVolume = volumeUsd1d * 365;
    const yearlyFeePool = yearlyVolume * (feeTierPct / 100);
    const yearlyFeeUser = userShare * yearlyFeePool;
    const adjustedFeeIncome = yearlyFeeUser * (percentInRange / 100);
    const feeIncome = adjustedFeeIncome * (days / 365);

    // Expected IL: weighted average over historical prices within [Pa, Pb]
    const inRangePrices = ratioSeries
      .map(p => p.price)
      .filter(p => p >= Pa && p <= Pb);
    let expectedIl = 0;
    if (inRangePrices.length > 0) {
      const ilSum = inRangePrices.reduce((sum, Pi) =>
        sum + Math.abs(concentratedIL(currentPrice, Pi, Pa, Pb)), 0);
      expectedIl = ilSum / inRangePrices.length;
    }
    const yearlyIlCost = deposit * expectedIl;
    const ilCost = yearlyIlCost * (days / 365);

    const netReturn = feeIncome - ilCost;
    return {
      feeIncome: round2(feeIncome),
      ilCost: round2(ilCost),
      netReturn: round2(netReturn),
      netReturnPercent: round2(netReturn / deposit * 100),
    };
  }

  return {
    deposit,
    historical: {
      daily: historicalPeriod(1),
      weekly: historicalPeriod(7),
      monthly: historicalPeriod(30),
      yearly: historicalPeriod(365),
    },
    projected: {
      daily: projectedPeriod(1),
      weekly: projectedPeriod(7),
      monthly: projectedPeriod(30),
      yearly: projectedPeriod(365),
    },
  };
}

function zeroPeriod() {
  return { feeIncome: 0, ilCost: 0, netReturn: 0, netReturnPercent: 0 };
}

function parseFeeTier(poolMeta) {
  if (!poolMeta) return 0;
  const cleaned = poolMeta.replace('%', '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// --- Utility functions ---

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
