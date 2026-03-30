Last updated: 2026-03-24

# Frontend Specification

Single-page React app (Vite). Two views, client-side routing. Light theme only.

---

## Project setup

| Tool | Choice |
|------|--------|
| Scaffolding | Vite (`npm create vite@latest -- --template react`) |
| Language | JavaScript (no TypeScript for simplicity) |
| Routing | `react-router-dom` v6 |
| Styling | Plain CSS (one stylesheet per component, co-located) |
| Charts | Recharts |
| State | React hooks (`useState`, `useEffect`) + `fetch` |
| HTTP | Browser `fetch` API — no axios, no React Query |

### Dependencies

```json
{
  "react": "^18",
  "react-dom": "^18",
  "react-router-dom": "^6",
  "recharts": "^2"
}
```

No other runtime dependencies.

---

## File structure

```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx                  # ReactDOM.createRoot, BrowserRouter
│   ├── App.jsx                   # Route definitions
│   ├── App.css                   # Global styles, CSS reset
│   ├── hooks/
│   │   └── useFetch.js           # Shared fetch hook
│   ├── utils/
│   │   └── formatters.js         # CompactNumber, formatPercent, formatCurrency
│   ├── components/
│   │   ├── AppHeader.jsx
│   │   ├── AppHeader.css
│   │   ├── ErrorBanner.jsx
│   │   ├── ErrorBanner.css
│   │   ├── Spinner.jsx
│   │   └── Spinner.css
│   └── pages/
│       ├── PoolExplorer/
│       │   ├── PoolExplorer.jsx
│       │   ├── PoolExplorer.css
│       │   ├── FilterBar.jsx
│       │   ├── FilterBar.css
│       │   ├── PoolTable.jsx
│       │   ├── PoolTable.css
│       │   ├── Pagination.jsx
│       │   └── Pagination.css
│       └── PoolAnalysis/
│           ├── PoolAnalysis.jsx
│           ├── PoolAnalysis.css
│           ├── PoolHeader.jsx
│           ├── RiskSlider.jsx
│           ├── RiskSlider.css
│           ├── PriceWindowCard.jsx
│           ├── PriceWindowCard.css
│           ├── PriceChart.jsx
│           ├── PriceChart.css
│           ├── VolatilityStats.jsx
│           ├── VolatilityStats.css
│           ├── DepositInput.jsx
│           ├── DepositInput.css
│           ├── ReturnsCard.jsx
│           └── ReturnsCard.css
```

---

## Shared hook: `useFetch`

A minimal custom hook that wraps `fetch`. Every API call in the app uses this.

```js
// useFetch(url) → { data, loading, error, refetch }
//
// - `data`    — parsed JSON response, null until loaded
// - `loading` — boolean, true while request is in flight
// - `error`   — error message string, null if no error
// - `refetch` — function, call to re-trigger the request
//
// Behaviour:
// - Fires fetch on mount and whenever `url` changes
// - Aborts in-flight request if url changes or component unmounts (AbortController)
// - On non-2xx response: sets error to response body's `message` field
// - On network failure: sets error to "Network error. Check your connection."
```

---

## Shared utility: `formatters.js`

```js
// compactNumber(value) → string
//   1234        → "$1.2K"
//   1234567     → "$1.2M"
//   1234567890  → "$1.2B"
//
// formatPercent(value) → string
//   37.234 → "37.2%"
//   0.05   → "0.1%"
//
// formatCurrency(value) → string
//   3000.5 → "$3,000.50"
```

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
│  Pair      Platform  Chain  Fee   TVL▼  Vol24h  │
│                                   APR   Vol30d  │
│                                         Score▼  │
│  ─────────────────────────────────────────────  │
│  USDC/ETH  Uni v3   ETH   0.3%  $250M  $85M .. │
│  WBTC/ETH  Uni v3   ETH   0.3%  $180M  $42M .. │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  < Prev   1 2 3 ... 25   Next >                 │
└─────────────────────────────────────────────────┘
```

#### Component: `FilterBar`

Two native `<select>` dropdowns side-by-side.

| Dropdown | Options | Default |
|----------|---------|---------|
| Platform | "All", "Uniswap v3" | "All" |
| Chain | "All", then chains from `GET /api/platforms` for the selected platform(s) | "All" |

**Behaviour:**
- On mount, fetch `GET /api/platforms` to populate chain options.
- When Platform changes: reset Chain to "All", update chain dropdown options to show only chains available for the selected platform.
- When either dropdown changes: parent re-fetches `GET /api/pools` with updated `platform` and `chain` query params. Reset pagination to offset 0.

#### Component: `PoolTable`

A plain HTML `<table>`.

| Column | Field | Sortable | Format | Alignment |
|--------|-------|----------|--------|-----------|
| Pair | `token0.symbol / token1.symbol` | no | `USDC / ETH` | left |
| Platform | `platform` | no | display name lookup | left |
| Chain | `chain` | no | capitalize | left |
| Fee | `feeTier` | no | `0.3%` | right |
| TVL | `tvl` | yes | `compactNumber` | right |
| 24h Volume | `volume24h` | yes | `compactNumber` | right |
| Fee APR | `feeApr` | yes | `formatPercent` | right |
| 30d Vol | `volatility30d` | yes | `formatPercent` | right |
| Score | `score` | yes (default) | `78 / 100` | right |

**Behaviour:**
- Clicking a sortable column header sets `sort` param and toggles `order` (desc → asc → desc).
- Active sort column shows `▲` or `▼` indicator next to the header text.
- Clicking a table row navigates to `/pool/{poolId}`.
- Row hover: light grey background (`#f5f5f5`).
- Row cursor: `pointer`.

**Platform display name mapping:**

| Slug | Display |
|------|---------|
| `uniswap-v3` | Uni v3 |

#### Component: `Pagination`

Simple prev/next with page numbers.

- 50 items per page (matches API default `limit=50`).
- Show: `< Prev  1 2 3 ... N  Next >`.
- Max 7 page buttons visible; use ellipsis for gaps.
- Prev disabled on page 1. Next disabled on last page.
- Clicking a page number re-fetches with `offset = (page - 1) * 50`.

#### Data fetching

```
URL: /api/pools?platform={}&chain={}&sort={}&order={}&limit=50&offset={}
```

Built from FilterBar, PoolTable sort state, and Pagination state. All three pieces of state live in `PoolExplorer` and are passed down as props.

#### UI States

| State | What renders |
|-------|-------------|
| **Loading** | `<Spinner>` centered in table area. FilterBar visible but dropdowns disabled. |
| **Empty** | Message: "No pools match your filters. Try broadening your selection." No table, no pagination. |
| **Error** | `<ErrorBanner>` above table with retry button. Retry calls `refetch()`. |
| **Loaded** | FilterBar enabled, table rendered, pagination visible (if more than 1 page). |

---

### 2. Pool Analysis — `/pool/:poolId`

Detail page for one pool. Shows safe price window and historical chart.

#### Layout

```
┌─────────────────────────────────────────────────┐
│  ← Back to pools                                │
├─────────────────────────────────────────────────┤
│  USDC / ETH                                     │
│  Uniswap v3 · Ethereum · Fee: 0.3%              │
│  TVL: $250M    24h Vol: $85M    Fee APR: 37.2%  │
├─────────────────────────────────────────────────┤
│  Risk Tolerance                                  │
│  Safe ○────────●────────○ Max Yield              │
│       1  2  3  4  5  6  7  8  9  10             │
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
│  ┌─ Price History (1 year) ────────────────────┐│
│  │  $3400 ┤          ╭─╮                       ││
│  │  $3200 ┤    ╭─────╯ ╰──╮  ····upper······  ││
│  │  $3000 ┤────╯           ╰───── current ──   ││
│  │  $2800 ┤                       ····lower··   ││
│  │  $2600 ┤                                     ││
│  │        └─────────────────────────────────    ││
│  │        Mar Apr May Jun Jul Aug Sep Oct       ││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  1Y Std Dev: 3.42%  │  Max Drawdown: 28.5%  │  │
│  Days in range: 91.2%                           │
├─────────────────────────────────────────────────┤
│  Deposit Amount                                  │
│  $ [  10,000  ]  [Calculate]                     │
├─────────────────────────────────────────────────┤
│  ┌─ Estimated Returns ─────────────────────────┐│
│  │           Historical          Projected      ││
│  │         Fees  IL   Net      Fees  IL   Net   ││
│  │  Weekly  $72  -$12 $59     $72  -$9   $63   ││
│  │          ─────────(0.59%)  ─────────(0.63%) ││
│  │  Monthly $310 -$49 $262    $310 -$37  $273  ││
│  │          ─────────(2.62%)  ─────────(2.73%) ││
│  │  Yearly  $3.7K-$380$3.3K  $3.7K-$442 $3.3K ││
│  │          ────────(33.43%)  ────────(32.81%) ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

#### Component: `PoolHeader`

Displays pool identity and key metrics. Data comes from the analysis API response.

| Item | Format |
|------|--------|
| Pair | `USDC / ETH` (large, bold) |
| Subtitle | `{platformName} · {chain} · Fee: {feeTier}%` |
| Metrics row | Three items: `TVL: {compactNumber}`, `24h Vol: {compactNumber}`, `Fee APR: {formatPercent}` |

Note: The analysis endpoint does not return TVL/volume/feeApr. These are passed via `react-router-dom` navigation state from the PoolExplorer row click:

```js
navigate(`/pool/${pool.id}`, { state: { pool } });
```

On the analysis page, read with `useLocation().state.pool`. If state is missing (direct URL access), show only the pair name from the analysis response and omit TVL/volume/APR.

#### Component: `RiskSlider`

An `<input type="range">` element.

| Property | Value |
|----------|-------|
| min | 1 |
| max | 10 |
| step | 1 |
| default | 5 |
| label left | "Safe" |
| label right | "Max Yield" |

**Behaviour:**
- Display the current numeric value above or beside the thumb.
- Fire the API call on `onMouseUp` / `onPointerUp` — NOT on every drag movement.
- While the new request is in flight, show a small inline spinner next to the slider. Keep the previous results visible until new data arrives (no flash of empty state).

#### Component: `PriceWindowCard`

A bordered card (`border: 1px solid #e0e0e0`, `border-radius: 8px`, `padding: 20px`).

| Row | Format |
|-----|--------|
| Lower | `formatCurrency(lowerPrice)` |
| Upper | `formatCurrency(upperPrice)` |
| Spread | `±{spreadPercent / 2}%` |
| Confidence | `{confidenceLevel}% of historical prices stayed in this range` |
| Est. IL | `{ilAtLower}%` (show as negative, red text if worse than -5%) |

#### Component: `PriceChart`

Recharts `<LineChart>` with `<ResponsiveContainer>`.

| Element | Recharts component | Style |
|---------|-------------------|-------|
| Price line | `<Line>` | Solid, `#2563eb` (blue), strokeWidth 2, no dots |
| Upper bound | `<ReferenceLine>` | Dashed, `#ef4444` (red), label "Upper" |
| Lower bound | `<ReferenceLine>` | Dashed, `#ef4444` (red), label "Lower" |
| Current price | `<ReferenceLine>` | Solid, `#16a34a` (green), label "Current" |
| Safe zone fill | `<ReferenceArea>` | Between lower and upper, `#22c55e` opacity 0.08 |
| X axis | `<XAxis>` | Month labels (`Mar`, `Apr`, ...), `dataKey="timestamp"`, formatted |
| Y axis | `<YAxis>` | Price in USD, `formatCurrency` |
| Tooltip | `<Tooltip>` | Shows date + exact price on hover |

**Data:** `priceHistory[]` from the analysis response. X = timestamp (format to date), Y = price.

Chart dimensions: 100% width of container, 300px height.

#### Component: `VolatilityStats`

Three stats displayed in a horizontal row (flexbox, evenly spaced).

| Stat | Label | Format |
|------|-------|--------|
| `stdDev1y` | 1Y Std Dev | `formatPercent` |
| `maxDrawdown1y` | Max Drawdown | `formatPercent`, red text |
| `percentInRange` | Days in range | `formatPercent`, green text if > 80% |

#### Component: `DepositInput`

A dollar amount input with a "Calculate" button.

| Element | Detail |
|---------|--------|
| Input | `<input type="number">`, min `1`, step `any`, placeholder `e.g. 10000` |
| Prefix | `$` label left of input |
| Button | "Calculate" — triggers re-fetch with `deposit` param |

**Behaviour:**
- Deposit value stored as state in `PoolAnalysis` parent.
- Clicking "Calculate" (or pressing Enter in the input) re-fetches the analysis endpoint with the current `risk` and `deposit` values.
- If input is empty or ≤ 0, button is disabled.
- While request is in flight, button shows "Calculating..." and is disabled.

#### Component: `ReturnsCard`

A table showing historical and projected returns side by side. Only rendered when `returns` is present in the API response (i.e., deposit was provided).

**Table layout:**

| | Historical | | | Projected | | |
|---|---|---|---|---|---|---|
| **Period** | **Fees** | **IL** | **Net** | **Fees** | **IL** | **Net** |
| Weekly | $71.60 | -$12.30 | $59.30 (0.59%) | $71.60 | -$8.50 | $63.10 (0.63%) |
| Monthly | $310.25 | -$48.70 | $261.55 (2.62%) | $310.25 | -$36.80 | $273.45 (2.73%) |
| Yearly | $3,723 | -$380 | $3,343 (33.43%) | $3,723 | -$442 | $3,281 (32.81%) |

**Formatting:**
- Fee income: green text (`#16a34a`)
- IL cost: red text (`#dc2626`), always shown with `-` prefix
- Net return: green if positive, red if negative
- Percentage shown in parentheses next to net return
- All dollar values use `formatCurrency`; large values use `compactNumber`

**Card style:** Same bordered card as `PriceWindowCard` (`border: 1px solid #e0e0e0`, `border-radius: 8px`, `padding: 20px`). Title: "Estimated Returns".

#### Data fetching

```
URL: /api/pools/{poolId}/analysis?risk={sliderValue}&deposit={depositValue}
```

- Fetch on mount with `risk=5` (no deposit — returns section hidden).
- Re-fetch on slider `onPointerUp` with new risk value (preserves deposit if set).
- Re-fetch on "Calculate" button click with deposit value.
- `poolId` from `useParams()`.

#### UI States

| State | What renders |
|-------|-------------|
| **Loading** (initial) | `PoolHeader` visible (from navigation state). `<Spinner>` replaces everything below. Slider disabled. |
| **Loading** (slider change) | All previous content stays visible. Small spinner inline next to slider. Slider remains interactive. |
| **Error** | `<ErrorBanner>` below header. Retry calls `refetch()`. |
| **Loaded** | All sections rendered. Slider enabled. |
| **No deposit yet** | `DepositInput` visible with empty field. `ReturnsCard` hidden. |
| **Deposit submitted** | `ReturnsCard` rendered below `VolatilityStats` with return data. |
| **Direct URL access** | If `useLocation().state` is null: `PoolHeader` shows only pair name (no TVL/volume/APR). Everything else works normally. |

---

## Routing

```jsx
<BrowserRouter>
  <AppHeader />
  <Routes>
    <Route path="/" element={<PoolExplorer />} />
    <Route path="/pool/:poolId" element={<PoolAnalysis />} />
  </Routes>
</BrowserRouter>
```

| Path | Page | Initial fetch |
|------|------|---------------|
| `/` | Pool Explorer | `GET /api/pools?sort=score&order=desc&limit=50&offset=0` |
| `/pool/:poolId` | Pool Analysis | `GET /api/pools/:poolId/analysis?risk=5` |

---

## Shared components

### `AppHeader`

Simple top bar. App name "LQ-Pool" on the left. No navigation links. Fixed height: 48px. Background: `#ffffff`. Bottom border: `1px solid #e5e7eb`.

### `ErrorBanner`

Red banner at the top of the content area.

- Background: `#fef2f2`, border: `1px solid #fecaca`, text color: `#991b1b`.
- Shows error message text + "Retry" button on the right.
- Dismissible via "×" button (sets error to null locally).

### `Spinner`

CSS-only spinner. 32px diameter, 3px border, `border-top-color: #2563eb`, `animation: spin 0.6s linear infinite`. Centered in its container via flexbox.

---

## Global styles (`App.css`)

```css
/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* Base */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  color: #1f2937;
  background: #ffffff;
  line-height: 1.5;
}

a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
th { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }

button {
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
}
button:hover { background: #f9fafb; }
button:disabled { opacity: 0.5; cursor: not-allowed; }

select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  background: #ffffff;
}
```

---

## Dev server proxy

Vite config proxies `/api` to the Node.js backend:

```js
// vite.config.js
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
}
```

---

## Responsive behavior

Desktop-only. Minimum supported width: 1024px. No mobile layout for MVP.
