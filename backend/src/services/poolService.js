import { fetchPools } from '../clients/defiLlamaClient.js';
import { InvalidParamError } from '../middleware/errorHandler.js';

const SUPPORTED_PROJECTS = new Set(['uniswap-v3']);
const VALID_SORT_FIELDS = new Set(['score', 'tvl', 'volume24h', 'feeApr', 'volatility30d']);

export async function getPools(platforms, chains, minTvl, minVolume, sort, order, limit, offset) {
  if (!VALID_SORT_FIELDS.has(sort)) {
    throw new InvalidParamError(`sort must be one of: ${[...VALID_SORT_FIELDS].join(', ')}`);
  }
  if (order !== 'asc' && order !== 'desc') {
    throw new InvalidParamError("order must be 'asc' or 'desc'");
  }
  if (limit < 1 || limit > 200) {
    throw new InvalidParamError('limit must be between 1 and 200');
  }
  if (offset < 0) {
    throw new InvalidParamError('offset must be >= 0');
  }

  const raw = await fetchPools();

  const filtered = raw.filter(p =>
    SUPPORTED_PROJECTS.has(p.project) &&
    p.tvlUsd != null && p.tvlUsd >= minTvl &&
    p.volumeUsd1d != null && p.volumeUsd1d >= minVolume &&
    (platforms.length === 0 || platforms.includes(p.project)) &&
    (chains.length === 0 || chains.includes(toChainSlug(p.chain)))
  );

  let pools = toScoredPools(filtered);

  const sortKey = sort === 'volume24h' ? 'volume24h' : sort;
  pools.sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return order === 'desc' ? -diff : diff;
  });

  const total = pools.length;
  const page = pools.slice(offset, offset + limit);
  return { total, pools: page };
}

function toScoredPools(rawPools) {
  const preliminary = rawPools.map(toPoolWithoutScore);

  const aprs = preliminary.map(p => p.feeApr);
  const minApr = Math.min(...aprs);
  const maxApr = Math.max(...aprs);
  const range = maxApr - minApr;

  return preliminary.map(p => ({
    ...p,
    score: range > 0 ? Math.round((p.feeApr - minApr) / range * 100) : 50,
  }));
}

function toPoolWithoutScore(raw) {
  const symbols = raw.symbol ? raw.symbol.split('-', 2) : ['?', '?'];
  const sym0 = symbols[0] || '?';
  const sym1 = symbols[1] || '?';

  const tokens = raw.underlyingTokens || [];
  const addr0 = tokens[0] || null;
  const addr1 = tokens[1] || null;

  const feeTier = parseFeeTier(raw.poolMeta);
  const tvl = raw.tvlUsd ?? 0;
  const volume24h = raw.volumeUsd1d ?? 0;
  const feeApr = raw.apyBase ?? 0;

  return {
    id: raw.pool,
    platform: raw.project,
    chain: toChainSlug(raw.chain),
    token0: { symbol: sym0, name: sym0, address: addr0 },
    token1: { symbol: sym1, name: sym1, address: addr1 },
    feeTier,
    tvl,
    volume24h,
    feeApr,
    volatility30d: 0,
    score: 0,
  };
}

function parseFeeTier(poolMeta) {
  if (!poolMeta) return 0;
  const cleaned = poolMeta.replace('%', '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function toChainSlug(chain) {
  if (!chain) return '';
  switch (chain) {
    case 'BSC': return 'bsc';
    case 'Avalanche': return 'avalanche';
    default: return chain.toLowerCase();
  }
}
