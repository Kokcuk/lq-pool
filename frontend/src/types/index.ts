export interface Platform {
  id: string;
  name: string;
  chains: string[];
}

export interface Token {
  symbol: string;
  name: string;
  address: string;
}

export interface Pool {
  id: string;
  platform: string;
  chain: string;
  token0: Token;
  token1: Token;
  feeTier: number;
  tvl: number;
  volume24h: number;
  feeApr: number;
  volatility30d: number;
  score: number;
}

export interface PoolsResponse {
  total: number;
  pools: Pool[];
}

export interface PriceWindow {
  lowerPrice: number;
  upperPrice: number;
  spreadPercent: number;
  isCustomRange: boolean;
}

export interface VolatilityMetrics {
  stdDev1y: number;
  maxDrawdown1y: number;
  percentInRange: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface ReturnEstimate {
  feeIncome: number;
  ilCost: number;
  netReturn: number;
  netReturnPercent: number;
}

export interface ReturnBreakdown {
  daily: ReturnEstimate;
  weekly: ReturnEstimate;
  monthly: ReturnEstimate;
  yearly: ReturnEstimate;
}

export interface GasCosts {
  chain: string;
  open: number;
  collect: number;
  close: number;
  total: number;
  percentOfDeposit: number;
}

export interface Returns {
  deposit: number;
  historical: ReturnBreakdown;
  projected: ReturnBreakdown;
}

export interface PoolAnalysis {
  poolId: string;
  chain: string;
  currentPrice: number;
  riskTolerance: number;
  confidenceLevel: number;
  priceWindow: PriceWindow;
  ilAtLower: number;
  ilAtUpper: number;
  volatilityMetrics: VolatilityMetrics;
  priceHistory: PricePoint[];
  returns?: Returns;
  gasCosts?: GasCosts;
}

export type SortField = 'score' | 'tvl' | 'volume24h' | 'feeApr' | 'volatility30d';
export type SortOrder = 'asc' | 'desc';

export interface PoolsParams {
  platform?: string;
  chain?: string;
  sort?: SortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}
