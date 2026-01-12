# Testudo Web - Developer Handoff

**Last Updated:** 2026-01-12

## Quick Start

```bash
cd /home/m0xu/1-projects/testudo/testudo-web/apps/web
bun install
bun run build   # Should pass with 0 errors
bun run dev     # Dev server on localhost:5173
```

Backend required:
```bash
cd /home/m0xu/1-projects/testudo/testudo-exchange
cargo run --bin router  # API on localhost:8080
```

---

## Project Overview

**Testudo** is a perpetual futures trading platform with:
- **Shadow Mode** - Paper trading with simulated execution
- **Live Mode** - Real orders on Binance Futures

### Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Charts | Lightweight Charts (TradingView-style) |
| Real-time | Direct Binance WebSocket (`wss://fstream.binance.com`) |
| Backend | Rust (Actix-web), PostgreSQL, Redis |

---

## Current State (2026-01-12)

### Working Features
- Real-time candlestick chart with WebSocket streaming
- Order book depth visualization
- Recent trades feed
- Price ticker with 24h stats
- Market selector (539 USDT perpetual pairs)
- Buy/sell order form
- Price alerts with audio notifications
- Keyboard shortcuts (Ctrl+B/S, Ctrl+Enter)

### Recent Fixes
| Date | Issue | Fix |
|------|-------|-----|
| 2026-01-12 | Chart not updating real-time | Timestamp ms→s conversion, symbol normalization |

---

## Architecture

### Data Flow
```
Binance Futures API (fapi.binance.com)
        ↓
   Rust Backend (:8080)
        ↓
    React Frontend
        ↓
┌───────┴───────┐
↓               ↓
REST API    WebSocket (direct to Binance)
(klines,    (depth, trades, bookTicker, kline)
 ticker,
 markets)
```

### Key Files
```
apps/web/src/
├── utils/
│   ├── binance_ws.ts      # WebSocket manager (toBinanceSymbol conversion)
│   ├── chart_manager.ts   # Lightweight Charts wrapper
│   ├── requests.ts        # Backend API calls
│   └── format.ts          # Number formatting
├── components/
│   ├── trade_interface/
│   │   └── TradeView.tsx  # Chart component with kline subscription
│   ├── depth/
│   │   └── OrderBook.tsx  # Order book display
│   ├── MarketBar.tsx      # Price header
│   └── SwapInterface.tsx  # Buy/sell form
├── state/
│   └── TradesProvider.tsx # Global state context
└── pages/
    └── Trade.tsx          # Main trading page
```

---

## Symbol Format

The system handles multiple symbol formats:

| Input | WebSocket | Backend API |
|-------|-----------|-------------|
| `SOLUSDT` | `solusdt` | `SOLUSDT` |
| `SOL_USDC` | `solusdt` | `SOLUSDT` |
| `sol/usdc` | `solusdt` | `SOLUSDT` |

Conversion handled by:
- Frontend: `toBinanceSymbol()` in `binance_ws.ts`
- Backend: `to_binance_symbol()` in `binance_data.rs`

---

## API Reference

### Backend REST (localhost:8080)
```
GET  /api/v1/market-data/ticker?symbol=SOLUSDT
GET  /api/v1/market-data/orderbook?symbol=SOLUSDT&limit=20
GET  /api/v1/market-data/klines?symbol=SOLUSDT&interval=1h&limit=500
GET  /api/v1/market-data/markets
POST /api/v1/order
```

### Binance WebSocket (direct)
```
wss://fstream.binance.com/stream?streams=
  solusdt@depth@100ms/
  solusdt@aggTrade/
  solusdt@bookTicker/
  solusdt@kline_1h
```

---

## Known Issues / TODO

### High Priority
- [ ] Position display with P&L
- [ ] Leverage settings UI
- [ ] Account balance display

### Medium Priority
- [ ] Dark/light theme toggle
- [ ] Mobile responsive improvements
- [ ] E2E tests with Playwright

---

## Testing

```bash
# Build check
bun run build

# Type check only
bun run tsc --noEmit

# Lint
bun run lint
```

Manual testing:
1. Navigate to http://localhost:5173/trade/SOLUSDT
2. Verify chart updates in real-time (watch latest candle)
3. Change timeframe (1m, 5m, 1h) - chart should reload and continue updating
4. Check order book updates
5. Check price ticker updates

---

## Continuation Prompt

```
Continue development on testudo-web trading frontend.

Context:
- Read HANDOFF.md for current state
- Build: `bun run build` (should pass)
- Dev: `bun run dev` (localhost:5173)

Current focus: [describe task]

Design principles:
- Loading skeletons for async data
- Error states with retry
- Use format.ts for numbers
- No console.log in production
- ARIA accessibility
```
