# Chart Data Flow Diagram

## End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BINANCE API                                         │
│                     https://api.binance.com/api/v3/klines                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP GET
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TESTUDO BACKEND (Rust)                                   │
│                    /api/v1/market-data/klines                                   │
│                                                                                  │
│  Request:  ?symbol=SOL_USDC&interval=1h&limit=500                               │
│                                                                                  │
│  Response: {                                                                     │
│    "success": true,                                                              │
│    "data": [                                                                     │
│      {                                                                           │
│        "timestamp": 1768093200000,    ← milliseconds since epoch                │
│        "open": "136.39000000",                                                   │
│        "high": "136.47000000",                                                   │
│        "low": "136.10000000",                                                    │
│        "close": "136.30000000",                                                  │
│        "volume": "21840.66800000",                                               │
│        "quote_volume": "2976426.86264000"                                        │
│      },                                                                          │
│      ... 499 more                                                                │
│    ],                                                                            │
│    "error": null                                                                 │
│  }                                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ axios.get()
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND: requests.ts getKlines()                          │
│                                                                                  │
│  Transform backend format → frontend KLine format:                               │
│                                                                                  │
│  Backend:                          Frontend (KLine type):                        │
│  ─────────                         ───────────────────────                       │
│  timestamp: 1768093200000    →     start: "1768093200000"                       │
│  open: "136.39"              →     open: "136.39"                                │
│  high: "136.47"              →     high: "136.47"                                │
│  low: "136.10"               →     low: "136.10"                                 │
│  close: "136.30"             →     close: "136.30"                               │
│  volume: "21840.66"          →     volume: "21840.66"                            │
│  quote_volume: "2976426"     →     quoteVolume: "2976426"                        │
│  (calculated)                →     end: "1768096800000" (timestamp + interval)   │
│  (not provided)              →     trades: "0"                                   │
│                                                                                  │
│  Returns: KLine[] (500 items)                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ return klineData
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND: TradeView.tsx fetchKlineData()                   │
│                                                                                  │
│  Transform KLine[] → ChartManager format:                                        │
│                                                                                  │
│  KLine:                            cleanedKlineData:                             │
│  ──────                            ─────────────────                             │
│  open: "136.39"              →     open: 136.39 (parseFloat)                    │
│  high: "136.47"              →     high: 136.47 (parseFloat)                    │
│  low: "136.10"               →     low: 136.10 (parseFloat)                     │
│  close: "136.30"             →     close: 136.30 (parseFloat)                   │
│  end: "1768096800000"        →     timestamp: Date(1768096800000)               │
│                                                                                  │
│  Note: Uses x.end (not x.start) for timestamp                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ new ChartManager()
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND: chart_manager.ts ChartManager                    │
│                                                                                  │
│  Transform cleanedKlineData → lightweight-charts format:                         │
│                                                                                  │
│  cleanedKlineData:                 setData() format:                             │
│  ─────────────────                 ────────────────                               │
│  open: 136.39                →     open: 136.39                                  │
│  high: 136.47                →     high: 136.47                                  │
│  low: 136.10                 →     low: 136.10                                   │
│  close: 136.30               →     close: 136.30                                 │
│  timestamp: Date(...)        →     time: UTCTimestamp (seconds, not ms!)        │
│                                                                                  │
│  Conversion in constructor:                                                      │
│  time: (data.timestamp / 1000) as UTCTimestamp                                   │
│        ↑                                                                         │
│        └─ timestamp is Date or number                                            │
│           - If Date: .getTime() / 1000                                          │
│           - If number: / 1000                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ candleSeries.setData()
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      LIGHTWEIGHT-CHARTS LIBRARY                                  │
│                                                                                  │
│  Expects data in format:                                                         │
│  {                                                                               │
│    time: UTCTimestamp,  // seconds since epoch (NOT milliseconds!)              │
│    open: number,                                                                 │
│    high: number,                                                                 │
│    low: number,                                                                  │
│    close: number                                                                 │
│  }                                                                               │
│                                                                                  │
│  Renders candlestick chart to DOM                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RENDERED CHART                                      │
│                         <div ref={chartRef} />                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Type Definitions

```typescript
// Frontend KLine type (types.ts)
interface KLine {
  close: string;
  end: string;      // milliseconds as string
  high: string;
  low: string;
  open: string;
  quoteVolume: string;
  start: string;    // milliseconds as string
  trades: string;
  volume: string;
}

// Transformed data for ChartManager
interface CandleData {
  timestamp: number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

// lightweight-charts expects
interface CandlestickData {
  time: UTCTimestamp;  // seconds since epoch
  open: number;
  high: number;
  low: number;
  close: number;
}
```

## Current Bug Analysis

The data transformation chain is CORRECT. The issue is NOT with data.

The issue is with **component state/rendering**:
- Data loads successfully (500 klines)
- `hasData` is set to `true`
- But `chartRef.current` is `null` because the div hasn't rendered yet
- Code exits early without creating the chart
