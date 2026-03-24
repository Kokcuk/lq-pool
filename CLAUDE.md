# LQ-Pool — Liquidity Pool Analyzer

## Project overview

A localhost web tool for crypto liquidity providers to find profitable concentrated-liquidity pools across Uniswap v3, SushiSwap v3, and PancakeSwap v3, and calculate safe price windows to minimize impermanent loss.

## Tech stack

- **Backend:** Java 17+, Spring MVC (REST)
- **Frontend:** React (Vite), TypeScript
- **Database:** None (stateless, API-passthrough)
- **External APIs:** DeFiLlama Yields, CoinGecko

## Project structure

- `/docs` — Specifications (main, data model, API, frontend, agents)
- Backend and frontend code TBD (not yet scaffolded)

## Specs

Full specs live in `/docs`. Read them before implementing anything:
- `docs/main.md` — Goals, scope, supported DEXes/chains
- `docs/data-model.md` — Entities, scoring formula, IL calculation
- `docs/api.md` — REST endpoints, external API integration
- `docs/frontend.md` — Pages, components, UI states
- `docs/agents.md` — Agent definitions (spec agent)

## Workflow

- After completing any piece of work, **always ask the user** if they want to commit and push, with a short summary of what was done.
