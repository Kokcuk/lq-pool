Last updated: 2026-03-24

# Frontend Specification

Single-page React app (Vite). Two views, client-side routing.

---

## Pages

### 1. Pool Explorer — `/`

The landing page. Shows a ranked list of concentrated-liquidity pools.

#### Layout

```
┌─────────────────────────────────────────────────┐
│  LQ-Pool                                        │
├─────────────────────────────────────────────────┤
│  Filters:                                       │
│  [Platform ▼ All]  [Chain ▼ All]                │
├─────────────────────────────────────────────────┤
│  Pair       Platform  Chain   TVL    Vol 24h    │
│             ▼ Fee     ▼       ▼ APR  ▼ Vol30d   │
│                                      ▼ Score ▼  │
│  ───────────────────────────────────────────── │
│  USDC/ETH   Uni v3   ETH    $250M  $85M  ...   │
│  WBTC/ETH   Uni v3   ETH    $180M  $42M  ...   │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  < 1 2 3 ... 25 >                               │
└─────────────────────────────────────────────────┘
```

#### Components

| Component | Description |
|-----------|-------------|
| `FilterBar` | Dropdowns for Platform (multi-select) and Chain (multi-select). Changing a filter re-fetches `/api/pools`. |
| `PoolTable` | Sortable table. Clicking a column header toggles sort. Clicking a row navigates to `/pool/{poolId}`. |
| `Pagination` | Offset-based, 50 per page. Shows page numbers + prev/next. |

#### Table columns

| Column | Field | Sortable | Format |
|--------|-------|----------|--------|
| Pair | `token0.symbol / token1.symbol` | no | text |
| Platform | `platform` | no | display name |
| Chain | `chain` | no | display name |
| Fee Tier | `feeTier` | no | `0.3%` |
| TVL | `tvl` | yes | `$250M`, `$1.2B` (compact) |
| 24h Volume | `volume24h` | yes | `$85M` (compact) |
| Fee APR | `feeApr` | yes | `37.2%` |
| 30d Volatility | `volatility30d` | yes | `4.1%` |
| Score | `score` | yes (default) | `78/100` |

#### UI States

| State | Behavior |
|-------|----------|
| **Loading** | Spinner centered in table area. Filters disabled. |
| **Empty** | "No pools match your filters." with suggestion to broaden filters. |
| **Error** | Red banner above table: "Failed to load pools. [Retry]" button. |
| **Loaded** | Table populated, filters enabled. |

---

### 2. Pool Analysis — `/pool/{poolId}`

Detail page for a single pool. Shows the safe price window calculation.

#### Layout

```
┌─────────────────────────────────────────────────┐
│  ← Back to pools                                │
├─────────────────────────────────────────────────┤
│  USDC / ETH                                     │
│  Uniswap v3 · Ethereum · Fee: 0.3%              │
│                                                  │
│  TVL: $250M    24h Vol: $85M    Fee APR: 37.2%  │
├─────────────────────────────────────────────────┤
│  Risk Tolerance                                  │
│  Safe ○──────●──────────○ Max Yield              │
│        1  2  3  4  5  6  7  8  9  10            │
│                                                  │
│  Current Price: $3,000.50                        │
├─────────────────────────────────────────────────┤
│  ┌─ Recommended Price Window ──────────────────┐│
│  │  Lower:  $2,550.42                          ││
│  │  Upper:  $3,450.58                          ││
│  │  Spread: ±15.0%                             ││
│  │  Confidence: 90% of historical prices       ││
│  │  Est. IL at boundary: -3.8%                 ││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  Price History (1 year)                          │
│                                                  │
│  $3400 ┤          ╭─╮                            │
│  $3200 ┤    ╭─────╯ ╰──╮  ········upper·······  │
│  $3000 ┤────╯           ╰──────── current ────  │
│  $2800 ┤                        ········lower··  │
│  $2600 ┤                                         │
│        └──────────────────────────────────────   │
│        Mar  Apr  May  Jun  Jul  Aug  Sep  Oct    │
├─────────────────────────────────────────────────┤
│  Volatility Stats                                │
│  1Y Std Dev: 3.42%   Max Drawdown: 28.5%        │
│  Days in range: 91.2%                            │
└─────────────────────────────────────────────────┘
```

#### Components

| Component | Description |
|-----------|-------------|
| `BackLink` | `← Back to pools` navigates to `/` preserving previous filter state. |
| `PoolHeader` | Pool name, platform, chain, fee tier, key metrics (TVL, volume, APR). |
| `RiskSlider` | Range input 1–10, integer steps. Labels at 1 ("Safe") and 10 ("Max Yield"). Changing the value re-fetches `/api/pools/{poolId}/analysis?risk={value}`. |
| `PriceWindowCard` | Card showing lower/upper bounds, spread %, confidence level, estimated IL. Highlighted visually (border or background color based on risk level). |
| `PriceChart` | Line chart of 1-year daily price ratio. Overlay two horizontal dashed lines for upper/lower bounds. Shaded area between them. Current price as a solid horizontal line. |
| `VolatilityStats` | Three stats in a row: Std Dev, Max Drawdown, % days in range. |

#### Chart library

`[OPEN QUESTION]` Recharts or Chart.js? Both work. Recharts is more React-native. Chart.js is lighter.

#### UI States

| State | Behavior |
|-------|----------|
| **Loading** | Spinner replaces the content below the header. Slider disabled. |
| **Error** | Red banner: "Failed to load analysis. [Retry]". |
| **Loaded** | All sections rendered. Slider enabled. |
| **Slider change** | Only the analysis section shows a small inline spinner; chart and stats update when response arrives. Header stays visible. |

---

## Routing

| Path | Page | Data fetch |
|------|------|------------|
| `/` | Pool Explorer | `GET /api/pools?...` |
| `/pool/:poolId` | Pool Analysis | `GET /api/pools/:poolId/analysis?risk=5` (default) |

---

## Shared UI elements

| Element | Description |
|---------|-------------|
| `AppHeader` | App name "LQ-Pool" top-left. No nav links needed (only 2 pages). |
| `ErrorBanner` | Red bar with error message and retry button. Dismissible. |
| `Spinner` | Simple CSS spinner, centered in its container. |
| `CompactNumber` | Formats large numbers: `$1,234,567` → `$1.2M`. Used for TVL and volume columns. |

---

## Responsive behavior

Desktop-first. Minimum supported width: 1024px. No mobile layout for MVP.
