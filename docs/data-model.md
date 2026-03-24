Last updated: 2026-03-24

# Data Model

No database. All entities below are in-memory objects shaped by external API responses and internal calculations. Defined as plain JS objects (backend) / React TypeScript types (frontend).

---

## Entities

### Platform

Represents a supported DEX.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Slug identifier, e.g. `uniswap-v3` |
| `name` | `string` | Display name, e.g. `Uniswap v3` |
| `chains` | `string[]` | Supported chain slugs, e.g. `["ethereum", "arbitrum"]` |

```json
{
  "id": "uniswap-v3",
  "name": "Uniswap v3",
  "chains": ["ethereum", "arbitrum", "optimism", "polygon", "base", "bsc", "avalanche", "celo", "blast"]
}
```

---

### Chain

| Field | Type | Description |
|-------|------|-------------|
| `slug` | `string` | Identifier, e.g. `ethereum` |
| `name` | `string` | Display name, e.g. `Ethereum` |

---

### Token

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | `string` | Ticker, e.g. `ETH` |
| `name` | `string` | Full name, e.g. `Ethereum` |
| `address` | `string` | Contract address on the pool's chain |

---

### Pool

Central entity. One row per unique liquidity pool.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique pool identifier (from external API) |
| `platform` | `string` | DEX slug, e.g. `uniswap-v3` |
| `chain` | `string` | Chain slug, e.g. `ethereum` |
| `token0` | `Token` | Base token |
| `token1` | `Token` | Quote token |
| `feeTier` | `number` | Fee tier as percentage, e.g. `0.3`, `0.05`, `0.01`, `1.0` |
| `tvl` | `number` | Total value locked in USD |
| `volume24h` | `number` | 24-hour trading volume in USD |
| `feeApr` | `number` | Annualized fee return as percentage (derived from volume × feeTier / TVL × 365) |
| `volatility30d` | `number` | 30-day standard deviation of daily price-ratio changes (token0/token1), as percentage |
| `score` | `number` | Opportunity score 0–100 (see scoring section below) |

```json
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
```

---

### PoolAnalysis

Returned when the user requests IL analysis for a specific pool.

| Field | Type | Description |
|-------|------|-------------|
| `poolId` | `string` | The analyzed pool |
| `currentPrice` | `number` | Current price ratio (token0 per token1) |
| `riskTolerance` | `integer` | User's slider value 1–10 |
| `confidenceLevel` | `number` | Percentage of historical price movements captured by the window |
| `priceWindow` | `PriceWindow` | The recommended range |
| `ilAtLower` | `number` | Estimated IL % if price hits lower bound |
| `ilAtUpper` | `number` | Estimated IL % if price hits upper bound |
| `volatilityMetrics` | `VolatilityMetrics` | Supporting stats |
| `priceHistory` | `PricePoint[]` | 1-year daily price ratio data |

---

### PriceWindow

| Field | Type | Description |
|-------|------|-------------|
| `lowerPrice` | `number` | Lower bound of recommended range (token0/token1) |
| `upperPrice` | `number` | Upper bound of recommended range (token0/token1) |
| `spreadPercent` | `number` | Total width as % of current price, e.g. `20.0` means ±10% |

```json
{
  "lowerPrice": 2700.0,
  "upperPrice": 3300.0,
  "spreadPercent": 20.0
}
```

---

### VolatilityMetrics

| Field | Type | Description |
|-------|------|-------------|
| `stdDev1y` | `number` | 1-year daily standard deviation of price ratio (%) |
| `maxDrawdown1y` | `number` | Largest peak-to-trough move in 1 year (%) |
| `percentInRange` | `number` | % of days in last year the price stayed within the suggested window |

---

### PricePoint

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `long` | Unix timestamp (seconds) |
| `price` | `number` | Price ratio (token0/token1) at that point |

---

## Opportunity Score — Calculation

The score ranks pools by fee yield relative to volatility risk. Higher = better opportunity.

```
rawScore = feeApr / volatility30d
score    = normalize(rawScore, 0, 100)   // min-max across all fetched pools
```

**Filters applied before scoring:**
- Exclude pools with TVL < $100,000 (low liquidity, unreliable data)
- Exclude pools with volume24h < $10,000 (dead pools)

`[OPEN QUESTION]` Are these TVL/volume thresholds reasonable, or should they be configurable?

---

## Risk Tolerance → Confidence Level Mapping

The slider value (1–10) maps to how much historical price movement the window should capture:

| Slider | Label | Confidence | Meaning |
|--------|-------|-----------|---------|
| 1 | Very safe | 99% | Window covers 99% of historical daily prices — very wide range, lowest fees |
| 2 | | 97% | |
| 3 | Safe | 95% | |
| 4 | | 93% | |
| 5 | Moderate | 90% | |
| 6 | | 87% | |
| 7 | Growth | 83% | |
| 8 | | 80% | |
| 9 | Aggressive | 75% | |
| 10 | Max yield | 70% | Tight range, highest fee concentration, highest IL risk |

**Calculation:** Given the 1-year daily price ratio series, compute the percentile-based range around the current price at the mapped confidence level.

---

## IL Estimation Formula (Concentrated Liquidity)

For a concentrated liquidity position with range `[Pa, Pb]` and current price `P`:

When price moves to `P'` (still in range):

```
IL = 1 - ( (sqrt(P') - sqrt(Pa)) / (sqrt(P) - sqrt(Pa)) * (sqrt(P) * (sqrt(Pb) - sqrt(P))) / (sqrt(Pb) - sqrt(Pa)) + (sqrt(Pb) - sqrt(P')) / (sqrt(Pb) - sqrt(Pa)) * (sqrt(P) * (sqrt(P) - sqrt(Pa))) / (sqrt(Pb) - sqrt(Pa)) ) / V_hold
```

Simplified approximation used for display:

```
IL_concentrated ≈ IL_classic × (P_full_range / P_concentrated_range)
```

Where `IL_classic = 2 × sqrt(r) / (1 + r) - 1` and `r = P'/P`.

`[OPEN QUESTION]` Should we use the exact Uniswap v3 IL formula or the simplified approximation? The exact formula is more accurate but harder to explain to users.
