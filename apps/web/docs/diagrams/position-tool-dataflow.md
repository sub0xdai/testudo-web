# Position Drawing Tool - Dataflow Diagram

## Overview

TradingView-style drawable position tool that allows users to visually set Entry, Stop Loss, and Take Profit levels directly on the chart, with automatic position sizing and one-click order execution.

---

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION                                       │
│                                                                                  │
│   1. Click "Position Tool" button → Activates drawing mode                      │
│   2. Click on chart → Sets ENTRY PRICE                                          │
│   3. Drag mouse → Sets STOP LOSS (red zone appears)                             │
│   4. Drag handle → Sets TAKE PROFIT (green zone appears)                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CHART EVENT HANDLERS                                     │
│                 ChartManager.ts + PositionDrawingTool.tsx                       │
│                                                                                  │
│   Mouse Events:                                                                  │
│   ├─ onMouseDown → chart.coordinateToPrice(y) → setEntryPrice()                │
│   ├─ onMouseMove → update SL/TP preview lines                                   │
│   └─ onMouseUp   → finalize level, advance state                               │
│                                                                                  │
│   State Machine:                                                                 │
│   idle → drawing_entry → drawing_sl → drawing_tp → complete                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         POSITION CALCULATION                                     │
│                      useRiskCalculation.ts (existing)                           │
│                                                                                  │
│   Formula: positionSize = (accountBalance × riskPercent) / |entry - stopLoss|  │
│                                                                                  │
│   Input:                                                                         │
│   ├─ entryPrice      (from chart click)                                         │
│   ├─ stopLossPrice   (from chart drag)                                          │
│   ├─ takeProfitPrice (from handle drag)                                         │
│   ├─ accountBalance  (from API/config)                                          │
│   └─ riskPercent     (from RiskSettings: default 2%)                           │
│                                                                                  │
│   Output:                                                                        │
│   ├─ positionSize    (calculated quantity)                                      │
│   ├─ riskAmount      ($ at risk)                                                │
│   ├─ profitAmount    ($ potential profit)                                       │
│   └─ riskRewardRatio (R:R)                                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      VISUAL OVERLAY RENDERING                                    │
│                      PositionZoneOverlay.tsx                                    │
│                                                                                  │
│   ┌─────────────────────────────────────────┐                                   │
│   │  TP: 148.00 (+3.83%) $429              │  ← Green label                    │
│   │  ┌─────────────────────────────────┐   │                                   │
│   │  │░░░░░░░░ PROFIT ZONE ░░░░░░░░░░░│   │  ← rgba(34,197,94,0.2)            │
│   │  └─────────────────────────────────┘   │                                   │
│   │  ─ ─ ─ Entry: 142.54 ─ ─ ─ ─ ─ ─ ─    │  ← Dashed line                    │
│   │  Size: 78.74 | R:R 2.15 | [Execute]   │  ← Center label + button          │
│   │  ┌─────────────────────────────────┐   │                                   │
│   │  │▓▓▓▓▓▓▓▓ LOSS ZONE ▓▓▓▓▓▓▓▓▓▓▓▓│   │  ← rgba(239,68,68,0.2)            │
│   │  └─────────────────────────────────┘   │                                   │
│   │  SL: 140.00 (-1.78%) $200             │  ← Red label                      │
│   └─────────────────────────────────────────┘                                   │
│                                                                                  │
│   Features:                                                                      │
│   ├─ Draggable handles on SL/TP lines                                          │
│   ├─ Real-time recalculation on drag                                           │
│   ├─ Color-coded zones (green=profit, red=loss)                                │
│   └─ Execute button to submit order                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ORDER EXECUTION                                          │
│                      createOrder() → POST /api/v1/order                         │
│                                                                                  │
│   Request Payload:                                                               │
│   {                                                                              │
│     market: "SOLUSDT",                                                           │
│     side: "BUY",           ← entry > SL = LONG, entry < SL = SHORT             │
│     quantity: 78.74,       ← calculated position size                           │
│     price: 142.54,         ← entry price from drawing                           │
│     user_id: "...",                                                              │
│     execution_mode: "shadow" | "live"                                           │
│   }                                                                              │
│                                                                                  │
│   Response: Order confirmation → Toast notification                             │
│   Order appears in Open Orders panel                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TradeView.tsx                                       │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │  Toolbar: [Crosshair] [Position Tool*] [Zoom] [...]                    │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         Chart Container                                  │   │
│   │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│   │  │  ChartManager (lightweight-charts)                                │  │   │
│   │  │  ├─ Candlestick series                                            │  │   │
│   │  │  ├─ Price lines (entry/SL/TP)  ← DRAW-04                         │  │   │
│   │  │  └─ coordinateToPrice()        ← DRAW-01                         │  │   │
│   │  └───────────────────────────────────────────────────────────────────┘  │   │
│   │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│   │  │  PositionDrawingTool (overlay)  ← DRAW-02                        │  │   │
│   │  │  ├─ Mouse event handlers                                          │  │   │
│   │  │  ├─ Drawing state machine                                         │  │   │
│   │  │  └─ Keyboard shortcuts          ← DRAW-09                        │  │   │
│   │  └───────────────────────────────────────────────────────────────────┘  │   │
│   │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│   │  │  PositionZoneOverlay            ← DRAW-03                        │  │   │
│   │  │  ├─ Profit/Loss zones                                             │  │   │
│   │  │  ├─ Draggable handles           ← DRAW-06                        │  │   │
│   │  │  └─ Execute button              ← DRAW-07                        │  │   │
│   │  └───────────────────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## State Machine

```
                    ┌──────────────────┐
                    │      IDLE        │
                    │  (tool inactive) │
                    └────────┬─────────┘
                             │ User clicks "Position Tool"
                             ▼
                    ┌──────────────────┐
                    │  DRAWING_ENTRY   │
                    │ (awaiting click) │
                    └────────┬─────────┘
                             │ User clicks on chart
                             ▼
                    ┌──────────────────┐
                    │   DRAWING_SL     │
                    │ (drag to set SL) │
                    └────────┬─────────┘
                             │ User releases mouse
                             ▼
                    ┌──────────────────┐
                    │   DRAWING_TP     │
                    │(drag handle for TP)│
                    └────────┬─────────┘
                             │ User sets TP (or skips)
                             ▼
                    ┌──────────────────┐
                    │    COMPLETE      │
                    │ (ready to execute)│
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         [Execute]      [Adjust]       [Cancel]
              │              │              │
              ▼              │              ▼
      Order Submitted   Back to COMPLETE   IDLE
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Cancel drawing, return to IDLE |
| `Enter` | Execute order (when COMPLETE) |
| `P` | Toggle Position Tool (when focused) |

---

## Files to Create/Modify

| Task | File | Description |
|------|------|-------------|
| DRAW-01 | `src/utils/chart_manager.ts` | Add `coordinateToPrice()`, `priceToCoordinate()` |
| DRAW-02 | `src/components/chart/PositionDrawingTool.tsx` | State machine + mouse handlers |
| DRAW-03 | `src/components/chart/PositionZoneOverlay.tsx` | Visual zones + labels |
| DRAW-04 | `src/utils/chart_manager.ts` | `createPriceLine()` methods |
| DRAW-05 | `src/components/trade_interface/TradeView.tsx` | Toolbar button integration |
| DRAW-06 | `src/components/chart/PositionZoneOverlay.tsx` | Draggable handles |
| DRAW-07 | `src/components/chart/PositionDrawingTool.tsx` | `createOrder()` integration |
| DRAW-08 | `src/components/RiskAutomaton.tsx` | Convert to config-only panel |
| DRAW-09 | `src/components/chart/PositionDrawingTool.tsx` | Keyboard event handlers |

---

## Dependencies

- **lightweight-charts v4.2**: `series.coordinateToPrice()`, `series.priceToCoordinate()`, `series.createPriceLine()`
- **useRiskCalculation hook**: Existing position sizing logic (no changes needed)
- **createOrder()**: Existing order submission (no changes needed)
- **RiskConfig**: User's risk settings from `/api/v1/risk-config`
