Last updated: 2026-03-24

# Data Model

No database. All entities below are in-memory objects shaped by external API responses and internal calculations. Defined as plain JS objects (backend) / React TypeScript types (frontend).

---

## Entities

### Platform

Represents the supported DEX (currently Uniswap v3 only).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Slug identifier: `uniswap-v3` |
| `name` | `string` | Display name: `Uniswap v3` |
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

### Returns

Returned as part of the analysis response when the user provides a deposit amount. Contains both historical (what you would have earned) and projected (estimated future) returns.

| Field | Type | Description |
|-------|------|-------------|
| `deposit` | `number` | User's deposit amount in USD |
| `historical` | `ReturnBreakdown` | Based on actual fee income and actual IL over past periods |
| `projected` | `ReturnBreakdown` | Based on current fee APR and expected IL from the selected price window |

```json
{
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
```

---

### ReturnBreakdown

| Field | Type | Description |
|-------|------|-------------|
| `weekly` | `ReturnEstimate` | 7-day period |
| `monthly` | `ReturnEstimate` | 30-day period |
| `yearly` | `ReturnEstimate` | 365-day period |

---

### ReturnEstimate

| Field | Type | Description |
|-------|------|-------------|
| `feeIncome` | `number` | USD earned from trading fees in this period |
| `ilCost` | `number` | USD lost to impermanent loss in this period (always positive) |
| `netReturn` | `number` | USD net profit: `feeIncome - ilCost` (can be negative) |
| `netReturnPercent` | `number` | Net return as % of deposit: `netReturn / deposit * 100` |

---

## Concentrated Liquidity Math

All return and IL calculations use the full Uniswap v3 concentrated liquidity formulas. The key concept is that a deposit in a narrow range [Pa, Pb] is capital-efficient — it behaves like a much larger deposit spread across the full range.

---

### Capital Efficiency Multiplier

For a position with range `[Pa, Pb]` and current price `P` (where `Pa ≤ P ≤ Pb`):

```
capitalEfficiency = sqrt(P) / (sqrt(Pb) - sqrt(Pa))
```

This means a $10,000 deposit in a ±10% range around $3,000 acts like ~$50,000 in a full-range position. Tighter range → higher multiplier → more fees earned per dollar.

---

### Fee Income (Concentrated Liquidity)

Fee income depends on three factors: capital efficiency, share of liquidity, and time in range.

```
effectiveDeposit = deposit × capitalEfficiency
userShare        = effectiveDeposit / (tvl + effectiveDeposit)
```

#### Historical fee income

Day-by-day simulation over the period using actual price history:

```
For each day i in period (7d, 30d, 365d):
  P_i = price ratio on day i

  if Pa ≤ P_i ≤ Pb:
    // Price is in range — LP earns fees
    dailyFees_i = userShare × dailyVolume_i × (feeTier / 100)
  else:
    // Price is out of range — LP earns nothing
    dailyFees_i = 0

  feeIncome = sum(dailyFees_i)
```

Note: `capitalEfficiency` is recalculated each day using `P_i` since it shifts with price. `userShare` also shifts accordingly.

#### Projected fee income

Uses the current `capitalEfficiency` and `timeInRangePercent` from volatility metrics:

```
yearlyVolume        = volume24h × 365
yearlyFeePool       = yearlyVolume × (feeTier / 100)
yearlyFeeUser       = userShare × yearlyFeePool
adjustedFeeIncome   = yearlyFeeUser × (timeInRangePercent / 100)

For each period:
  feeIncome = adjustedFeeIncome × (days / 365)
```

Where `timeInRangePercent` = % of days in the last year the price stayed within `[Pa, Pb]` (from `volatilityMetrics.percentInRange`).

---

### IL Calculation (Concentrated Liquidity)

#### Position value at any price

For a concentrated liquidity position with range `[Pa, Pb]`, initial deposit at price `P₀`, and current price `P`:

```
If P ≤ Pa (below range — 100% in token1):
  V_position = L × (sqrt(Pb) - sqrt(Pa)) × (Pa / sqrt(Pa))
  // simplified: position is entirely token1

If Pa < P < Pb (in range):
  L = depositValue / (sqrt(P₀) × (sqrt(Pb) - sqrt(P₀)) / sqrt(Pb) + (sqrt(P₀) - sqrt(Pa)))
  V_position = L × (sqrt(P) × (sqrt(Pb) - sqrt(P)) / sqrt(Pb) + (sqrt(P) - sqrt(Pa)))

If P ≥ Pb (above range — 100% in token0):
  V_position = L × (sqrt(Pb) - sqrt(Pa))
  // simplified: position is entirely token0
```

Where `L` = liquidity units derived from the initial deposit.

#### Hold value (no LP, just hold the tokens)

```
// At entry, deposit is split: x₀ of token0, y₀ of token1
// such that x₀ × P₀ + y₀ = deposit (in token1 terms)

V_hold = x₀ × P + y₀
```

#### IL formula

```
IL = (V_position - V_hold) / V_hold
```

IL is always ≤ 0 (a loss). Expressed as a percentage.

#### IL at range boundaries (for display)

```
ilAtLower = IL calculated with P = Pa
ilAtUpper = IL calculated with P = Pb
```

These are shown in the PriceWindowCard so the user knows the worst-case IL if price hits the edge of their window.

---

### Historical IL

Day-by-day calculation over the period:

```
For each period (7d, 30d, 365d):
  P_start    = price ratio at start of period
  P_end      = price ratio at end of period
  V_position = position value at P_end (using formulas above, with P₀ = P_start)
  V_hold     = hold value at P_end
  ilCost     = deposit × abs((V_position - V_hold) / V_hold)
```

### Projected IL

Expected IL based on the historical price distribution within the selected window:

```
// Sample N historical daily prices from the 1-year dataset
// For each price P_i within [Pa, Pb], compute IL(P_i)
// Weight by frequency (how many days the price was near P_i)

expectedIl = weighted_average(IL(P_i) for all P_i in [Pa, Pb])
yearlyIlCost = deposit × abs(expectedIl)

For each period:
  ilCost = yearlyIlCost × (days / 365)
```

---

### Net Return

For both historical and projected:

```
netReturn        = feeIncome - ilCost
netReturnPercent = (netReturn / deposit) × 100
```

A positive `netReturn` means fees outweigh IL — the position is profitable.
