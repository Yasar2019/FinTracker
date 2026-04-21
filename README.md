# FinTracker

A polished personal investment tracker built with React + TypeScript.

## Features

- Sidebar-based dashboard app layout with dark/light mode
- Dashboard KPIs: total value, gain/loss $, gain/loss %, holdings count
- Allocation charts by asset class and account
- Top winners/losers and recent transactions
- Holdings page with search, filtering, sorting, badges, and editable prices
- Transactions page with add/edit/delete and automatic holdings recalculation
- Analytics charts:
  - Portfolio value over time
  - Gain/loss by holding
  - Performance by account
  - Monthly contributions
  - Dividend income (if data exists)
- Multiple account support (TFSA, RRSP, FHSA, Cash, Margin)
- Asset category support (stocks, ETFs, crypto, cash, mutual funds, bonds, other)
- Built-in realistic sample data for first launch
- CSV import with validation + clear errors
- CSV/JSON export
- Local-first persistence using `localStorage`, with code structured for future backend integration

## Tech Stack

- React + TypeScript (Vite)
- Tailwind CSS
- Recharts
- Papa Parse (CSV import/export)

## Run locally

```bash
npm install
npm run dev
```

## Build and lint

```bash
npm run lint
npm run build
```

## Future upgrade ideas

- Connect market-price APIs behind a small data service layer
- Add portfolio goals and allocation drift tracking
- Add watchlist and investment journal modules
- Add optional cloud sync/backend while keeping this local-first architecture
