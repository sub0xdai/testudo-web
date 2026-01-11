# TradeView Component State Machine

## State Variables

| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `isLoading` | boolean | `true` | Shows loading skeleton |
| `error` | string\|null | `null` | Error message to display |
| `hasData` | boolean | `false` | Whether kline data exists |
| `selectedTime` | TimeInterval | `"1h"` | Current time interval |
| `chartRef` | RefObject | `null` | DOM reference to chart container |
| `chartManagerRef` | RefObject | `null` | ChartManager instance |

## State Machine Diagram

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                      COMPONENT MOUNT                         │
                    └─────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │  INITIAL STATE                                               │
                    │  isLoading=true, error=null, hasData=false                   │
                    │  Renders: <ChartSkeleton />                                  │
                    └─────────────────────────────────────────────────────────────┘
                                              │
                                              │ useEffect triggers fetchKlineData()
                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │  FETCHING STATE                                              │
                    │  await getKlines(market, interval, startTime)                │
                    └─────────────────────────────────────────────────────────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                         ▼                    ▼                    ▼
              ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
              │  API ERROR       │ │  EMPTY DATA      │ │  DATA RECEIVED   │
              │  catch block     │ │  klineData.len=0 │ │  klineData.len>0 │
              └──────────────────┘ └──────────────────┘ └──────────────────┘
                         │                    │                    │
                         ▼                    ▼                    ▼
              ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
              │  ERROR STATE     │ │  NO DATA STATE   │ │  setHasData(true)│
              │  error=msg       │ │  hasData=false   │ │  hasData=true    │
              │  isLoading=false │ │  isLoading=false │ │                  │
              │                  │ │                  │ │                  │
              │  Renders:        │ │  Renders:        │ │  ⚠️ PROBLEM:      │
              │  <ChartError />  │ │  <ChartEmpty />  │ │  Chart div now   │
              └──────────────────┘ └──────────────────┘ │  renders but...  │
                                                        └──────────────────┘
                                                                   │
                                                                   ▼
                                              ┌─────────────────────────────────────┐
                                              │  WAIT FOR REACT RENDER              │
                                              │  await setTimeout(0)                │
                                              │                                     │
                                              │  ⚠️ RACE CONDITION:                  │
                                              │  React may not have rendered yet!   │
                                              └─────────────────────────────────────┘
                                                                   │
                                                                   ▼
                                              ┌─────────────────────────────────────┐
                                              │  CHECK chartRef.current             │
                                              │                                     │
                                              │  if (null) → return early ❌        │
                                              │  if (exists) → continue ✓           │
                                              └─────────────────────────────────────┘
                                                                   │
                                                                   ▼
                                              ┌─────────────────────────────────────┐
                                              │  TRANSFORM DATA                     │
                                              │  cleanedKlineData = klineData.map() │
                                              │  - parseFloat(close, high, low,open)│
                                              │  - new Date(parseInt(x.end))        │
                                              └─────────────────────────────────────┘
                                                                   │
                                                                   ▼
                                              ┌─────────────────────────────────────┐
                                              │  CREATE CHART                       │
                                              │  new ChartManager(                  │
                                              │    chartRef.current,                │
                                              │    cleanedKlineData,                │
                                              │    { background, color }            │
                                              │  )                                  │
                                              └─────────────────────────────────────┘
                                                                   │
                                                                   ▼
                                              ┌─────────────────────────────────────┐
                                              │  SUCCESS STATE                      │
                                              │  isLoading=false, hasData=true      │
                                              │  Renders: <div ref={chartRef} />    │
                                              │  Chart is visible! ✓                │
                                              └─────────────────────────────────────┘
```

## Render Decision Tree

```
if (isLoading) {
    return <ChartSkeleton />        // "Loading chart..."
}
else if (error) {
    return <ChartError />           // Error message + Retry button
}
else if (!hasData) {
    return <ChartEmpty />           // "No chart data available" ← STUCK HERE
}
else {
    return <div ref={chartRef} />   // Actual chart container
}
```

## Identified Issues

### Issue 1: Race Condition with React Rendering

**Problem:** `setHasData(true)` doesn't immediately cause React to render. The `setTimeout(0)` may not be enough time.

**Evidence:** Debug logs show `[DEBUG] Got 500 klines` but NOT `[DEBUG] Transformed data` - code exits at `chartRef.current` check.

### Issue 2: Conditional Rendering Chicken-and-Egg

**Problem:**
1. `hasData=false` → renders `<ChartEmpty />` (no chart div)
2. `chartRef.current = null` (div doesn't exist)
3. Code checks `chartRef.current` → null → returns early
4. `hasData` never properly transitions to allow chart

**Solution Options:**
1. Always render the chart div (hidden when no data)
2. Use a different state flow
3. Use `useLayoutEffect` instead of `useEffect`
