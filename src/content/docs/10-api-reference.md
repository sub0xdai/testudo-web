---
title: "API Reference"
description: "REST endpoints, WebSocket channels, and authentication."
order: 10
section: "technical"
---

The Testudo backend exposes a REST API on port 8080 and a WebSocket server on port 4000. All REST endpoints are under the `/api/v1` base path.

## Authentication

Testudo uses **Sign In with Ethereum (SIWE)** for authentication. There are two auth flows:

### Web/Desk Flow (Cookie-Based)

1. **Get nonce**: `GET /api/v1/auth/nonce` returns a one-time nonce
2. **Sign message**: Client constructs an EIP-4361 message and signs it with the user's wallet
3. **Verify**: `POST /api/v1/auth/verify-siwe` with `{ "message": "...", "signature": "0x..." }`
4. Server sets HttpOnly cookies: `access_token` (15 min TTL) and `refresh_token` (7 day TTL)
5. **Refresh**: `POST /api/v1/auth/refresh` uses the cookie to issue new tokens

Cookies are `Secure`, `HttpOnly`, `SameSite=Strict`.

### Extension Flow (Token-Based)

1. **Pair**: User generates a 6-digit code on the Desk via `POST /api/v1/auth/pair-extension`
2. **Claim**: Extension sends `POST /api/v1/auth/extension-pair` with `{ "code": "123456" }`
3. Server returns `{ "tokens": { "access_token": "...", "refresh_token": "...", "expires_in": 900 } }`
4. **Refresh**: `POST /api/v1/auth/extension-refresh` with `{ "refresh_token": "..." }`

The extension sends tokens via `Authorization: Bearer <token>` header.

### Session Management

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/auth/nonce` | GET | No | Get SIWE nonce |
| `/auth/verify-siwe` | POST | No | Verify signature, issue tokens |
| `/auth/refresh` | POST | Cookie | Refresh web session |
| `/auth/extension-refresh` | POST | Body | Refresh extension tokens |
| `/auth/pair-extension` | POST | Yes | Generate 6-digit pairing code |
| `/auth/extension-pair` | POST | No | Claim tokens with pairing code |
| `/auth/me` | GET | Yes | Get current user |
| `/auth/logout` | POST | Yes | Revoke current session |
| `/auth/revoke-all` | POST | Yes | Revoke all sessions |

## Health

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Liveness probe (always 200) |
| `/health/ready` | GET | Readiness probe (checks DB + sidecar) |
| `/health/sidecar` | GET | CEX sidecar health status |
| `/metrics` | GET | Prometheus metrics (text/plain) |

## Exchange Accounts

All exchange endpoints require authentication.

| Endpoint | Method | Description |
|---|---|---|
| `/exchanges` | GET | List available exchanges |
| `/exchanges/supported` | GET | List supported exchange IDs |
| `/exchanges/accounts` | GET | List user's exchange accounts |
| `/exchanges/accounts` | POST | Add exchange (API keys or wallet) |
| `/exchanges/accounts/{id}` | DELETE | Remove exchange account |
| `/exchanges/accounts/{id}/test` | POST | Test exchange connection |
| `/exchanges/accounts/{id}/balance` | GET | Fetch live balance |
| `/exchanges/accounts/{id}/positions` | GET | Fetch open positions |

### Add Exchange Account

```
POST /api/v1/exchanges/accounts
Content-Type: application/json

{
  "exchange_name": "binance",
  "api_key": "your-api-key",
  "secret": "your-secret",
  "passphrase": "okx-only"
}
```

Credentials are validated by fetching the account balance. On success, a trade history import is automatically triggered.

### Agent Wallet (Hyperliquid)

| Endpoint | Method | Description |
|---|---|---|
| `/exchanges/agent-wallet/init` | POST | Generate agent wallet keypair |
| `/exchanges/agent-wallet/approve` | POST | Approve agent for trading |
| `/exchanges/agent-wallet/{id}/revoke` | DELETE | Revoke agent wallet |

## Trade Execution

All trade endpoints require authentication.

| Endpoint | Method | Description |
|---|---|---|
| `/trades` | POST | Create trade with entry + SL + TP |
| `/trades` | GET | List active trade groups |
| `/trades/{id}` | GET | Get trade group details |
| `/trades/{id}` | DELETE | Cancel entire trade group |
| `/trades/{id}/sl` | PUT | Update stop-loss price |
| `/trades/{id}/tp` | PUT | Update take-profit targets |
| `/trades/{id}/breakeven` | PUT | Toggle break-even protection |
| `/trades/cleanup` | POST | Purge stale ghost orders |

### Create Trade

```
POST /api/v1/trades
Content-Type: application/json

{
  "symbol": "BTC_USDT",
  "side": "buy",
  "entry_price": "50000.00",
  "quantity": "0.5",
  "stop_loss_price": "49000.00",
  "take_profit": [
    { "price": "51500.00", "quantity": "0.25", "order_type": "limit" },
    { "price": "53000.00", "quantity": "0.25", "order_type": "limit" }
  ],
  "idempotency_key": "uuid"
}
```

All trades pass through the **Decision Loop** which validates:
- Stop-loss presence (if required by risk config)
- Leverage within limits
- Max open positions not exceeded
- Daily drawdown within limit
- Risk:Reward ratio above minimum
- Position size within all four constraints

Returns the trade group ID and individual order details.

## Trade History Import

| Endpoint | Method | Description |
|---|---|---|
| `/trades/import` | POST | Start history import for an exchange account |
| `/trades/import/status` | GET | Get import job status |

```
POST /api/v1/trades/import
Content-Type: application/json

{ "exchange_account_id": "uuid" }
```

## Journal & Analytics

All journal endpoints require authentication.

### Analytics

| Endpoint | Method | Description |
|---|---|---|
| `/journal/analytics/overview` | GET | Trade count, win rate, avg R |
| `/journal/analytics/equity-curve` | GET | Cumulative P&L data points |
| `/journal/analytics/daily-pnl` | GET | P&L by day |
| `/journal/analytics/symbol-breakdown` | GET | P&L by symbol |
| `/journal/analytics/duration-profit` | GET | Duration vs. profitability |
| `/journal/analytics/return-distribution` | GET | Return histogram buckets |
| `/journal/analytics/time-distribution` | GET | Trades by time of day/week |
| `/journal/analytics/filter-options` | GET | Available filter values |

### Trade Journal

| Endpoint | Method | Description |
|---|---|---|
| `/journal/trades` | GET | List trades (paginated) |
| `/journal/trades/{id}` | GET | Get trade with notes and tags |
| `/journal/trades/{id}/notes` | PATCH | Update trade notes |
| `/journal/trades/{id}/tags` | POST | Add tag to trade |
| `/journal/trades/{id}/tags/{tag_id}` | DELETE | Remove tag from trade |

### Journal Entries

| Endpoint | Method | Description |
|---|---|---|
| `/journal/entries` | GET | List entries |
| `/journal/entries` | POST | Create entry |
| `/journal/entries/{id}` | GET | Get entry |
| `/journal/entries/{id}` | PUT | Update entry |
| `/journal/entries/{id}` | DELETE | Delete entry |

### Tags

| Endpoint | Method | Description |
|---|---|---|
| `/journal/tags` | GET | List all tags |
| `/journal/tags` | POST | Create tag |
| `/journal/tags/{id}` | PUT | Update tag |
| `/journal/tags/{id}` | DELETE | Delete tag |

### Storage

| Endpoint | Method | Description |
|---|---|---|
| `/journal/upload` | POST | Upload image (multipart) |
| `/journal/storage` | GET | Get storage usage |
| `/journal/images/{id}` | DELETE | Delete image |

## Risk Configuration

| Endpoint | Method | Description |
|---|---|---|
| `/risk-config` | GET | Get risk config |
| `/risk-config` | PUT | Update risk config |

```
PUT /api/v1/risk-config
Content-Type: application/json

{
  "account_risk_percent": 2.0,
  "max_risk_amount": 150.0,
  "max_position_size": 0.5,
  "max_leverage": 5,
  "daily_max_drawdown_percent": 5.0,
  "max_open_positions": 5,
  "require_stop_loss": true,
  "min_risk_reward_ratio": 1.5
}
```

## WebSocket

The WebSocket server runs on port 4000. Messages use JSON.

### Connecting

Connect to `ws://host:4000` (or `wss://` in production). No authentication is required at the WebSocket layer.

### Subscribing

```json
{
  "method": "SUBSCRIBE",
  "params": ["order.{user_id}"],
  "id": 1
}
```

### Unsubscribing

```json
{
  "method": "UNSUBSCRIBE",
  "params": ["order.{user_id}"],
  "id": 2
}
```

### Channels

| Channel | Format | Events |
|---|---|---|
| `order` | `order.{user_id}` | Order fills, cancellations, status changes |
| `depth` | `depth.{symbol}` | Orderbook updates |
| `trade` | `trade.{symbol}` | Trade stream |
| `ticker` | `ticker.{symbol}` | Price ticker updates |
| `balance` | `balance.{user_id}` | Balance changes |

### Event Format

```json
{
  "stream": "order.550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "e": "order_update",
    "s": "BTC_USDT",
    "status": "filled"
  }
}
```

The WebSocket server uses PostgreSQL `LISTEN/NOTIFY` internally — when the router processes an order event, it calls `pg_notify()` which the WebSocket server receives and broadcasts to subscribed clients.
