Last updated: 2026-03-24

# API Specification

Base URL: `http://localhost:8080/api`

All responses use `Content-Type: application/json`. No authentication.

---

## Internal API (Backend → Frontend)

### GET /api/platforms

List the supported DEX and its chains.

**Request:** none

**Response 200:**

```json
[
  {
    "id": "uniswap-v3",
    "name": "Uniswap v3",
    "chains": ["ethereum", "arbitrum", "optimism", "polygon", "base", "bsc", "avalanche", "celo", "blast"]
  }
]
```

**Errors:** none (static data)

---

### GET /api/pools

Fetch and rank concentrated-liquidity pools. Data is fetched on-demand from external APIs, not cached.

**Query parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `platform` | `string` | no | all | Filter by DEX slug: `uniswap-v3` |
| `chain` | `string` | no | all | Filter by chain slug. Comma-separated: `ethereum,arbitrum` |
| `minTvl` | `number` | no | `100000` | Minimum TVL in USD |
| `minVolume` | `number` | no | `10000` | Minimum 24h volume in USD |
| `sort` | `string` | no | `score` | Sort field: `score`, `tvl`, `volume24h`, `feeApr`, `volatility30d` |
| `order` | `string` | no | `desc` | Sort order: `asc` or `desc` |
| `limit` | `integer` | no | `50` | Max results (1–200) |
| `offset` | `integer` | no | `0` | Pagination offset |

**Response 200:**

```json
{
  "total": 1243,
  "pools": [
    {
      "id": "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
      "platform": "uniswap-v3",
      "chain": "ethereum",
      "token0": { "symbol": "USDC", "name": "USD Coin", "address": "0xa0b8..." },
      "token1": { "symbol": "ETH", "name": "Ethereum", "address": "0xc02a..." },
      "feeTier": 0.3,
      "tvl": 250000000,
      "volume24h": 85000000,
      "feeApr": 37.23,
      "volatility30d": 4.12,
      "score": 78
    }
  ]
}
```

**Errors:**

| Code | Condition | Body |
|------|-----------|------|
| 400 | Invalid query param value | `{ "error": "INVALID_PARAM", "message": "..." }` |
| 502 | External API unreachable | `{ "error": "UPSTREAM_ERROR", "message": "..." }` |

---

### GET /api/pools/{poolId}/analysis

Compute the safe price window for a specific pool.

**Path parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `poolId` | `string` | Pool identifier (URL-encoded if needed) |

**Query parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `risk` | `integer` | no | `5` | Risk tolerance slider value 1–10 |
| `deposit` | `number` | no | none | Deposit amount in USD. When provided, response includes `returns` object. |

**Response 200:**

```json
{
  "poolId": "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
  "currentPrice": 3000.50,
  "riskTolerance": 5,
  "confidenceLevel": 90,
  "priceWindow": {
    "lowerPrice": 2550.42,
    "upperPrice": 3450.58,
    "spreadPercent": 30.0
  },
  "ilAtLower": -3.8,
  "ilAtUpper": -3.8,
  "volatilityMetrics": {
    "stdDev1y": 3.42,
    "maxDrawdown1y": 28.5,
    "percentInRange": 91.2
  },
  "priceHistory": [
    { "timestamp": 1679616000, "price": 2850.30 },
    { "timestamp": 1679702400, "price": 2870.10 }
  ],
  "returns": {
    "deposit": 10000,
    "historical": {
      "weekly":  { "feeIncome": 71.60, "ilCost": 12.30, "netReturn": 59.30, "netReturnPercent": 0.59 },
      "monthly": { "feeIncome": 310.25, "ilCost": 48.70, "netReturn": 261.55, "netReturnPercent": 2.62 },
      "yearly":  { "feeIncome": 3723.00, "ilCost": 380.00, "netReturn": 3343.00, "netReturnPercent": 33.43 }
    },
    "projected": {
      "weekly":  { "feeIncome": 71.60, "ilCost": 8.50, "netReturn": 63.10, "netReturnPercent": 0.63 },
      "monthly": { "feeIncome": 310.25, "ilCost": 36.80, "netReturn": 273.45, "netReturnPercent": 2.73 },
      "yearly":  { "feeIncome": 3723.00, "ilCost": 442.00, "netReturn": 3281.00, "netReturnPercent": 32.81 }
    }
  }
}
```

**Errors:**

| Code | Condition | Body |
|------|-----------|------|
| 400 | `risk` outside 1–10 | `{ "error": "INVALID_PARAM", "message": "risk must be 1-10" }` |
| 400 | `deposit` ≤ 0 | `{ "error": "INVALID_PARAM", "message": "deposit must be a positive number" }` |
| 404 | Pool not found | `{ "error": "POOL_NOT_FOUND", "message": "..." }` |
| 502 | External API unreachable | `{ "error": "UPSTREAM_ERROR", "message": "..." }` |

---

## External API Integrations

### DeFiLlama Yields API

Used to fetch pool listings with TVL, APY, and volume data.

**Endpoint:** `GET https://yields.llama.fi/pools`

**Response fields used:**

| Field | Maps to |
|-------|---------|
| `pool` | `Pool.id` |
| `project` | `Pool.platform` (filter: `uniswap-v3`) |
| `chain` | `Pool.chain` |
| `symbol` | Parsed into `token0.symbol` + `token1.symbol` |
| `tvlUsd` | `Pool.tvl` |
| `apyBase` | Used to derive `Pool.feeApr` |
| `volumeUsd1d` | `Pool.volume24h` |

**Rate limits:** None documented; implement 1 req/sec as courtesy.

---

### CoinGecko API

Used to fetch 1-year historical prices for both tokens in a pair, to compute the price ratio over time.

**Endpoint:** `GET https://api.coingecko.com/api/v3/coins/{coinId}/market_chart`

**Params:** `vs_currency=usd&days=365&interval=daily`

**Response fields used:**

| Field | Usage |
|-------|-------|
| `prices[][1]` | Daily USD price; fetched for both tokens, then compute `price_token0 / price_token1` for ratio series |

**Rate limits:** 10–30 req/min on free tier. Implement retry with backoff.

`[OPEN QUESTION]` CoinGecko free tier may be too slow for fetching many token pairs. Should we use CoinGecko Pro, or an alternative like DeFiLlama's coin prices API (`https://coins.llama.fi/chart/`)? DeFiLlama has no documented rate limits and is free.

---

### Token ID Resolution

CoinGecko requires a `coinId` (e.g. `ethereum`, `usd-coin`), not a contract address. We need a mapping strategy.

**Approach:** Use CoinGecko's `/coins/list?include_platform=true` endpoint at startup to build an in-memory map of `(chain, contract_address) → coinId`.

`[OPEN QUESTION]` Alternatively, DeFiLlama's price API accepts `{chain}:{address}` directly, which avoids the mapping problem. Should we prefer DeFiLlama for prices too?

---

## Error Response Shape

All error responses follow this shape:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| Error Code | HTTP Status | Meaning |
|-----------|-------------|---------|
| `INVALID_PARAM` | 400 | Query parameter validation failed |
| `POOL_NOT_FOUND` | 404 | Pool ID does not exist or is not a concentrated-liquidity pool |
| `UPSTREAM_ERROR` | 502 | External API (DeFiLlama / CoinGecko) is down or returned an error |
