---
title: "Architecture"
description: "System design, component map, and data flow."
order: 9
section: "technical"
---

Testudo is a multi-component system built around a Rust backend, three TypeScript frontends, and exchange API integrations.

## System Overview

```
TradingView (Browser)
    |
    | Alt+X (DOM scrape)
    v
Extension (Solid.js, Manifest V3)
    |
    | REST POST /api/v1/trades
    v
Router (Actix-web, Rust)
    |
    |--- Decision Loop (risk validation)
    |--- Risk Service (position sizing)
    |--- Shadow Engine (paper trades)
    |
    |--- CEX Sidecar (Node.js, port 3100)
    |       |
    |       v
    |    Exchange APIs (Binance, Bybit, OKX, etc.)
    |
    |--- Hyperliquid Service (integrated in router)
    |       |
    |       v
    |    Hyperliquid L1
    |
    v
PostgreSQL
    |
    | pg_notify (LISTEN/NOTIFY)
    v
WebSocket Server (tokio-tungstenite, port 4000)
    |
    v
Extension + Desk (real-time updates)
```

## Components

### testudo-exchange (Rust Backend)

The core backend, organized into 7 active crates:

| Crate | Purpose |
|---|---|
| **router** | Actix-web HTTP server, REST API routes, services (including Hyperliquid), middleware |
| **engine** | Matching engine, Shadow Engine (paper trading), OrderGroups |
| **common_utils** | Risk service, position sizer, exchange adapters |
| **pg_queue** | PostgreSQL-based high-performance messaging, queues (SKIP LOCKED + LISTEN/NOTIFY), and caching |
| **sqlx_postgres** | SQLx database client, migrations |
| **ws-stream** | WebSocket server for real-time event streaming |
| **db-processor** | Database operation handlers |

> **Note**: Redis is deprecated and has been replaced by `pg_queue` in the Rust backend for all message queuing and caching. Infrastructure still contains a Redis instance for legacy support and optional non-critical caching.

Key patterns:
- `Result<T, E>` everywhere (no `unwrap()` in production)
- `rust_decimal::Decimal` for all financial math (never `f64`)
- `BTreeMap` for orderbook (price-time priority)
- `DashMap` for lock-free concurrent balance access

### testudo-extension (Browser Extension)

Chrome/Firefox Manifest V3 extension built with Solid.js.

- **Content script** (`content.ts`): Injected into TradingView pages. Listens for Alt+X, runs the DOM scraper, launches the trade modal.
- **Background worker** (`background.ts`): Service worker handling authentication, WebSocket connections, message routing, and API calls.
- **Modal** (`modal.tsx`): Shadow DOM trade confirmation overlay with double-Enter safety.
- **Popup** (`popup/`): Extension toolbar popup showing balance, positions, and account info.
- **Schemas** (`schemas.ts`): Zod runtime validation for all message types and API responses.

### testudo-journal (Desk Dashboard)

Solid.js SPA served at `/desk`.

- **Overview**: Equity curve, stats sidebar, 11 chart types
- **Trades**: Sortable trade table, detail panels, active positions
- **Journal**: Timeline entries, collections, markdown editor, tag management
- **Account**: Exchange CRUD, onboarding stepper, extension pairing

### testudo-web (Landing Site)

Astro static site generator. Serves the marketing pages and documentation.

- Pure HTML/CSS output with minimal JavaScript (Solid.js islands for interactivity)
- Content collections for documentation (this site)
- Brutalist dark theme with Space Grotesk / Space Mono typography

## Data Flow: Trade Execution

A complete trade lifecycle from chart to exchange:

1. **Scrape**: Extension content script reads TradingView position tool DOM
2. **Modal**: Trade setup shown in confirmation overlay, position size calculated
3. **Confirm**: User double-enters, extension sends `EXECUTE_TRADE` message to background worker
4. **API Call**: Background worker POSTs to `/api/v1/trades` with entry, SL, TP, and sizing
5. **Decision Loop**: Router validates through RiskService (position sizing, drawdown limits, R:R ratio)
6. **Order Placement**: Approved orders sent to exchange via CEX sidecar or Hyperliquid SDK
7. **Bracket Orders**: SL (stop-market, reduce-only) and TP (limit) placed after entry confirms
8. **Notification**: `pg_notify` pushes order update through WebSocket server to extension
9. **Fill Detection**: WebSocket fill streaming detects SL/TP hits, updates trade status
10. **Journal**: On trade close, `journal_service.rs` records the trade with P&L, R-multiple, and daily stats

## Data Flow: Trade History Import

1. **Trigger**: User adds exchange (auto-trigger) or clicks "Import History"
2. **Queue**: Import job enqueued to `queue_imports` (pg_queue)
3. **Worker**: Background import worker picks up job via SKIP LOCKED
4. **Fetch**: Worker loads exchange credentials, fetches 90-day closing fills
5. **Map**: Each fill mapped to `TradeCloseEvent` (entry price derived from exit and P&L)
6. **Insert**: `record_trade_close()` inserts trade with dedup on `(user_id, exchange, exchange_fill_id)`
7. **Notify**: `pg_notify` sends `import_complete` event via WebSocket to frontend

## Infrastructure

- **Database**: PostgreSQL (primary datastore, job queue, pub/sub via LISTEN/NOTIFY)
- **Authentication**: SIWE (Sign In with Ethereum) + JWT + HttpOnly cookies
- **Encryption**: AES-256-GCM for exchange credentials at rest
- **WebSocket**: tokio-tungstenite on port 4000, subscribes to PostgreSQL notification channels
- **Job Queue**: pg_queue with SKIP LOCKED for concurrent worker safety
- **Deployment**: Kubernetes (GKE) with ArgoCD, NGINX Ingress, Prometheus + Grafana monitoring
