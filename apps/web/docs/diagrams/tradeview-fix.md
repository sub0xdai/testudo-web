# TradeView Fix: Always Render Chart Div

## Root Cause

The chart div (`<div ref={chartRef}>`) only renders when `hasData=true`. But we need the div to exist BEFORE we can attach ChartManager to it.

```jsx
// CURRENT (broken):
{isLoading ? <ChartSkeleton />
 : error ? <ChartError />
 : !hasData ? <ChartEmpty />    // ← chartRef div doesn't exist!
 : <div ref={chartRef} />}      // ← only renders when hasData=true
```

## The Fix

ALWAYS render the chart div. Layer overlays on top for loading/error/empty states.

```jsx
// FIXED:
<div className="relative w-full h-full">
  {/* Chart div ALWAYS rendered */}
  <div ref={chartRef} className="w-full h-full" />

  {/* Overlay states on top */}
  {isLoading && <ChartSkeleton />}
  {!isLoading && error && <ChartError />}
  {!isLoading && !error && !hasData && <ChartEmpty />}
</div>
```

## Fixed State Machine

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │  INITIAL STATE                                               │
                    │  isLoading=true, hasData=false                               │
                    │                                                              │
                    │  Renders:                                                    │
                    │  ├── <div ref={chartRef} /> (ALWAYS EXISTS!)                │
                    │  └── <ChartSkeleton /> (overlay)                            │
                    └─────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │  DATA RECEIVED                                               │
                    │  setHasData(true)                                            │
                    │  chartRef.current EXISTS! ✓                                  │
                    │                                                              │
                    │  → Transform data                                            │
                    │  → new ChartManager(chartRef.current, data)                  │
                    │  → Chart renders immediately!                                │
                    └─────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │  SUCCESS STATE                                               │
                    │  isLoading=false, hasData=true                               │
                    │                                                              │
                    │  Renders:                                                    │
                    │  └── <div ref={chartRef} /> (chart visible!)                │
                    │      (no overlays)                                           │
                    └─────────────────────────────────────────────────────────────┘
```

## Implementation

See the code change below.
