# Issue: Chart Not Updating in Real-Time

**Date:** 2026-01-12
**Status:** Fixed
**Priority:** High
**Resolved:** 2026-01-12

## Problem

After implementing Binance WebSocket streaming for market data, the chart was not updating in real-time. The orderbook, trades, and price display worked, but the candlestick chart remained static.

## Root Causes Found

1. **Timestamp unit mismatch** - Binance WebSocket sends timestamps in milliseconds, but lightweight-charts expects seconds
2. **Symbol format mismatch** - WebSocket used raw symbol (e.g., `sol_usdc`) but Binance expects `solusdt`

## Solution

### Fix 1: Timestamp Conversion (TradeView.tsx)
```typescript
// Convert startTime from milliseconds to seconds
time: Math.floor(data.startTime / 1000),
```

### Fix 2: Symbol Normalization (binance_ws.ts)
```typescript
function toBinanceSymbol(symbol: string): string {
  return symbol
    .replace(/_/g, '')
    .replace(/\//g, '')
    .replace(/USDC/gi, 'USDT')
    .toLowerCase();
}
```

### Fix 3: ChartManager Update Method (chart_manager.ts)
- Initialize `lastUpdateTime` in seconds
- Use provided time directly instead of re-dividing

## Commits

- `1408040` - fix: resolve chart not updating in real-time
- `bd4d159` - fix: normalize symbol format for WebSocket streams
- `931687f` - chore: remove debug console.log statements

## Files Modified

- `src/components/trade_interface/TradeView.tsx`
- `src/utils/binance_ws.ts`
- `src/utils/chart_manager.ts`

## Verification

Chart now updates in real-time when navigating to `/trade/SOLUSDT` or `/trade/SOL_USDC`.
