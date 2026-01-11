# Issue: Chart Not Updating in Real-Time

**Date:** 2026-01-12
**Status:** Open
**Priority:** High

## Problem

After implementing Binance WebSocket streaming for market data, the chart is not updating in real-time. The orderbook, trades, and price display may be working, but the candlestick chart remains static.

## What Was Implemented

1. `BinanceWsManager` (`src/utils/binance_ws.ts`) - WebSocket manager connecting to `wss://fstream.binance.com`
2. Streams subscribed:
   - `@depth@100ms` - Orderbook updates
   - `@aggTrade` - Trade events
   - `@bookTicker` - Best bid/ask (price)
   - `@kline_<interval>` - Candlestick data

3. `TradeView.tsx` updated to:
   - Subscribe to kline updates via `ws.onKlineUpdate()`
   - Call `chartManagerRef.current.update()` with new candle data

## Symptoms

- Chart loads initial data correctly
- Chart does not update when new trades/candles come in
- Changing timeframe doesn't show live updates

## Possible Causes to Investigate

1. **ChartManager.update() method** - May not be correctly updating the lightweight-charts series
2. **Time format mismatch** - Binance sends timestamps in milliseconds, chart may expect seconds
3. **WebSocket not receiving kline data** - Check browser DevTools Network tab for incoming messages
4. **Callback not being triggered** - The kline callback may not be registered correctly
5. **Race condition** - Chart may not be initialized when first kline update arrives

## Debugging Steps

1. Add console.log in `handleKlineUpdate()` to verify data is received
2. Add console.log in `TradeView.tsx` kline callback to verify it's called
3. Check browser DevTools → Network → WS tab for `@kline_` messages
4. Verify `chartManagerRef.current` exists when update is called
5. Check if `update()` method in ChartManager is correct for lightweight-charts API

## Related Files

- `src/utils/binance_ws.ts` - WebSocket manager
- `src/utils/chart_manager.ts` - Chart wrapper
- `src/components/trade_interface/TradeView.tsx` - Chart component

## Commits Related

- `aafde4e` - feat: add real-time kline streaming to chart
- `e32aec5` - feat: add Binance Futures WebSocket manager
