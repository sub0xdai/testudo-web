---
title: "The Extension"
description: "Alt+X workflow, trade confirmation, and managing positions from TradingView."
order: 4
section: "trader"
---

The Testudo Sniper extension is where trades happen. It lives in your browser, reads your chart setups from TradingView, and places orders on your exchange.

## The Alt+X Workflow

This is the core loop:

1. **Draw a position tool** on your TradingView chart (Long Position or Short Position). Set your entry, stop-loss, and take-profit levels.

2. **Press Alt+X.** The extension reads your position tool directly from the chart. It extracts the symbol, side, entry price, stop-loss price, and take-profit price.

3. **Review the confirmation modal.** The modal shows everything about the trade before you commit:
   - Symbol and side (LONG / SHORT)
   - Entry, stop-loss, and take-profit prices
   - Risk:Reward ratio (color-coded: green at 2:1 or better, amber at 1:1 or better, red below 1:1)
   - Position size (auto-calculated from your risk rules)
   - Margin required and risk amount in dollars
   - Your current available balance

4. **Confirm with double-Enter.** Press Enter once to arm the confirmation (button turns from red to green). Press Enter again to execute. This two-step mechanism prevents accidental order placement.

5. **Trade executes.** The entry order is placed on your exchange with stop-loss and take-profit bracket orders. A toast notification confirms the order was sent.

## The Confirmation Modal

The modal appears as an overlay on TradingView. It uses Shadow DOM isolation so it doesn't interfere with TradingView's interface.

### Auto-Filled Fields

All price fields are auto-filled from your chart's position tool. Each auto-filled field shows an "auto" badge. You can click the badge to clear it and enter a manual value.

### Position Sizing

The modal calculates position size automatically using your risk configuration:

- **Size**: Quantity in base currency (e.g., 0.15 BTC)
- **Leverage**: From your risk config (default 1x)
- **Margin**: How much collateral the trade requires
- **Risk**: Dollar amount you'd lose if stopped out

The sizing follows the "conservative wins" rule — the smallest of four constraints (account %, max risk amount, max position size, margin capacity) determines the final size.

### Management Rules

Below the prices, the modal shows your active management preset:

- **Risk %**: Percentage of account risked on this trade
- **Break-even**: Whether the stop moves to entry after partial take-profit
- **Trailing stop**: Off, or the trailing distance
- **Partial TP**: Off, or the percentage to close at each target

### Double-Enter Safety

This is intentional friction. Live trading means real money, and a single misclick shouldn't cost you.

- **First Enter**: Arms the confirmation. Button text changes from "Arm Confirm" to "Confirm Now". Button color changes from red to green.
- **Second Enter**: Executes the trade. Modal closes, order is sent to exchange.
- **Escape**: Cancels at any point.

If you edit any field after arming, the confirmation resets — you'll need to press Enter twice again.

## The Popup

Click the extension icon in your browser toolbar to open the popup. It's a compact trading dashboard.

### Balance Panel

The top section shows:

- **Balance**: Your total account balance in USD
- **Available / Locked**: How much is free vs. allocated to open positions
- **Exchange badge**: Which exchange is active (e.g., "WOO", "Hyperliquid")
- **Exposure gauge**: A semi-circle arc showing what percentage of your account is deployed. Green (low) through amber (moderate) to red (high).

### Tabs

**TRADE** — Position sizing calculator and management preset controls.

**POSITIONS** — All active trades. Each position card shows:
- Symbol and direction (LONG / SHORT)
- Entry price and stop-loss
- Take-profit targets
- Status (Active, Pending, Stopped, etc.)
- Time since open
- Cancel button

**ACCOUNT** — Balance breakdown, exposure percentage, wallet address, and exchange account info.

### Real-Time Updates

The extension maintains a WebSocket connection to the backend. When an order fills, gets stopped out, or hits take-profit, the popup updates immediately — balance refreshes and position cards update their status.

## Scraper Strategies

The extension uses a multi-strategy fallback system to read position tools from TradingView's DOM. This handles TradingView UI updates gracefully:

1. **Chart API** — Direct access to chart internals via TradingView's internal API. Most reliable.
2. **Properties Dialog (semantic)** — Reads from named input fields in the position tool dialog.
3. **Properties Dialog (generic)** — Scans for price inputs when semantic names change.
4. **Legacy fallbacks** — Panel scanning and overlay parsing for older TradingView versions.

If the primary strategy fails, the extension tries the next one automatically. If all strategies fail, it falls back to symbol-only detection and you fill in prices manually in the modal.

## CEX vs. DEX

The extension works with both centralized exchanges (Binance, WOO, Bybit, OKX) and decentralized exchanges (Hyperliquid).

- **CEX mode**: Orders route through a backend sidecar that handles exchange-specific API formats. Balance displayed in USDT/USDC.
- **DEX mode (Hyperliquid)**: Orders route through the native Hyperliquid SDK via an agent wallet. No intermediary.

You can switch between exchanges from the popup header. The active exchange determines where orders are placed and which balance is displayed.
