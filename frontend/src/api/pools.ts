import type { Platform, PoolsResponse, PoolsParams, PoolAnalysis } from '../types';

const BASE = '/api';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchPlatforms(): Promise<Platform[]> {
  return request<Platform[]>('/platforms');
}

export async function fetchPools(params: PoolsParams): Promise<PoolsResponse> {
  const q = new URLSearchParams();
  if (params.platform) q.set('platform', params.platform);
  if (params.chain) q.set('chain', params.chain);
  if (params.sort) q.set('sort', params.sort);
  if (params.order) q.set('order', params.order);
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return request<PoolsResponse>(`/pools${qs ? '?' + qs : ''}`);
}

export async function fetchPoolAnalysis(
  poolId: string,
  risk: number,
  deposit?: number,
  customRange?: { lower: number; upper: number },
): Promise<PoolAnalysis> {
  const q = new URLSearchParams({ risk: String(risk) });
  if (deposit != null && deposit > 0) q.set('deposit', String(deposit));
  if (customRange) {
    q.set('lowerPrice', String(customRange.lower));
    q.set('upperPrice', String(customRange.upper));
  }
  return request<PoolAnalysis>(`/pools/${encodeURIComponent(poolId)}/analysis?${q}`);
}
