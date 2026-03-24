import { config } from '../config.js';
import { UpstreamError } from '../middleware/errorHandler.js';

export async function fetchPools() {
  try {
    const res = await fetch(config.defiLlama.poolsUrl, {
      signal: AbortSignal.timeout(config.http.timeoutMs),
    });
    if (!res.ok) throw new Error(`DeFiLlama pools responded ${res.status}`);
    const body = await res.json();
    return body.data || [];
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    throw new UpstreamError('Failed to fetch pools from DeFiLlama', err);
  }
}

export async function fetchPriceHistory(coin) {
  const start = Math.floor(Date.now() / 1000) - 365 * 24 * 3600;
  const url = `${config.defiLlama.coinsUrl}/${encodeURIComponent(coin)}?start=${start}&span=365&period=1d`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(config.http.timeoutMs),
    });
    if (!res.ok) throw new Error(`DeFiLlama coins responded ${res.status}`);
    const body = await res.json();
    const coinData = body.coins?.[coin];
    if (!coinData?.prices) return [];
    return coinData.prices.map(p => ({ timestamp: p.timestamp, price: p.price }));
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    throw new UpstreamError(`Failed to fetch price history from DeFiLlama for ${coin}`, err);
  }
}
