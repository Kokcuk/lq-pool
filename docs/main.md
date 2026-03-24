Last updated: 2026-03-24

# LQ-Pool — Liquidity Pool Analyzer

## Project description

A localhost web tool that helps a crypto liquidity provider find profitable concentrated-liquidity pools across major DEXes, and calculate a **safe price window** for any selected pair so they are unlikely to suffer impermanent loss (IL).

## Goals

1. **Discover** — aggregate concentrated-liquidity pools from Uniswap v3, SushiSwap v3, and PancakeSwap v3 across all chains they support.
2. **Rank** — score every pool by a profitability-vs-risk metric so the user sees the best opportunities first.
3. **Analyze** — for a chosen pool, compute a recommended price range based on 1 year of historical price data and the user's risk tolerance (slider 1–10).

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17+, Spring MVC (REST) |
| Frontend | React (Vite) |
| Database | None (stateless, API-passthrough) |
| External data | DeFiLlama Yields API, CoinGecko API |

## Supported DEXes and chains

| DEX | Chains |
|-----|--------|
| Uniswap v3 | Ethereum, Arbitrum, Optimism, Polygon, Base, BNB Chain, Avalanche, Celo, Blast |
| SushiSwap v3 | Ethereum, Arbitrum, Optimism, Polygon, Base, BNB Chain, Avalanche, Fantom |
| PancakeSwap v3 | BNB Chain, Ethereum, Arbitrum, Base, zkSync, Polygon zkEVM, Linea, opBNB |

## In-scope features (MVP)

- Browse & search pools across all supported DEXes and chains
- Ranked pool list by composite opportunity score (fee yield vs volatility)
- Pool detail view with key metrics (TVL, volume, fee tier, APR)
- Risk tolerance slider (1–10)
- Safe price window calculation based on historical volatility
- 1-year price history chart with recommended range overlay
- Estimated IL at range boundaries

## Explicitly out of scope (for now)

- User accounts / authentication
- Database / persistence
- Position tracking or portfolio management
- Curve Finance (stableswap AMM — no concentrated liquidity)
- Classic 50/50 pool analysis (Uniswap v2 style)
- Real-time price streaming / websockets
- On-chain transactions or wallet integration
- Mobile-specific UI
