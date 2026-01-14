# Position Primitive Architecture (V5 Hybrid)

## Overview

The position tool uses a hybrid Canvas + DOM architecture for native chart integration while maintaining interactive UI elements.

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TradeView.tsx                                      │
│  - Manages chartManager lifecycle                                           │
│  - Stores position state per market (positionsByMarket Map)                 │
│  - Activates/deactivates position tool                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PositionDrawingTool.tsx                                 │
│  - State machine: idle → ready → dragging → complete                        │
│  - Captures mouse events for drawing                                        │
│  - Manages primitive lifecycle (attach/detach)                              │
│  - Persists state via onStateChange callback                                │
└─────────────────────────────────────────────────────────────────────────────┘
                          │                    │
              ┌───────────┘                    └───────────┐
              ▼                                            ▼
┌────────────────────────────────┐    ┌────────────────────────────────────────┐
│   CANVAS LAYER (Native)        │    │   DOM LAYER (Interactive)               │
│                                │    │                                        │
│   PositionZonePrimitive.ts     │    │   PositionHandleOverlay.tsx            │
│   ├─ Implements IPanePrimitive │    │   ├─ Entry handle (orange)             │
│   ├─ Renders on each frame     │    │   ├─ Stop Loss handle (red)            │
│   ├─ Auto pan/zoom with chart  │    │   ├─ Take Profit handle (green)        │
│   └─ Z-order: behind candles   │    │   ├─ Right-edge handle (endTime)       │
│                                │    │   ├─ Stats panel (qty, risk, R:R)      │
│   Renders:                     │    │   └─ Execute button                    │
│   ├─ Profit zone (green fill)  │    │                                        │
│   ├─ Loss zone (red fill)      │    │   Interactions:                        │
│   ├─ Entry line (orange dash)  │    │   ├─ Drag handles → update levels      │
│   ├─ SL line (red dash)        │    │   ├─ Drag right edge → set endTime     │
│   ├─ TP line (green dash)      │    │   ├─ Double-click edge → clear endTime │
│   └─ Price axis labels         │    │   └─ Click execute → place order       │
└────────────────────────────────┘    └────────────────────────────────────────┘
              │                                            │
              └────────────────┬───────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ChartManager.ts                                     │
│  - attachPositionPrimitive() / detachPositionPrimitive()                    │
│  - updatePositionLevels({ entry, sl, tp, side, startTime, endTime })        │
│  - coordinateToPrice(y) / priceToCoordinate(price)                          │
│  - coordinateToTime(x) / timeToCoordinate(time)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     lightweight-charts V5                                    │
│  - IChartApi (chart instance)                                               │
│  - ISeriesApi (candlestick series)                                          │
│  - IPanePrimitive (custom canvas rendering)                                 │
│  - ITimeScaleApi (time coordinate conversion)                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Action                 Component                    Effect
───────────────────────────────────────────────────────────────────────────────
Click Position Tool    →    TradeView                →   activatePositionTool()
                            └─ sets state: 'ready'

Click + Hold on Chart  →    PositionDrawingTool      →   Captures entry price
                            └─ captures startTime         Sets state: 'dragging'
                            └─ attachPositionPrimitive()

Drag Mouse             →    PositionDrawingTool      →   Updates stopLoss
                            └─ updatePositionLevels()     Canvas repaints

Release Mouse          →    PositionDrawingTool      →   Auto-calculates TP
                            └─ sets state: 'complete'     Shows handles

Drag Handle            →    PositionHandleOverlay    →   Updates level
                            └─ onLevelChange()            Canvas repaints

Drag Right Edge        →    PositionHandleOverlay    →   Sets endTime
                            └─ onEndTimeChange()          Zone bounded

Pan/Zoom Chart         →    lightweight-charts       →   Triggers redraw
                            └─ PositionZonePrimitive      Zones move with chart
                               .draw() called

Switch Market          →    TradeView                →   Saves state to Map
(key={market})              └─ PositionDrawingTool        New instance
                               remounts with saved        Primitive re-attaches
                               initialState
```

## Time-Anchored Zones (GEOM Phase)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          │                               ┃                    │
│  Candlesticks        ════╬═══════════════════════════════┃════════════════════╡ TP
│     ████                 │▓▓▓▓▓▓ PROFIT ZONE ▓▓▓▓▓▓▓▓▓▓▓┃                    │
│   ██████             ════╬═══════════════════════════════┃════════════════════╡ Entry
│                          │░░░ LOSS ZONE ░░░░░░░░░░░░░░░░░┃                    │
│                      ════╬═══════════════════════════════┃════════════════════╡ SL
└──────────────────────────────────────────────────────────────────────────────┘
                           ▲                               ▲
                      startTime                       endTime (draggable)
                      (click time)                    (optional, defaults to edge)
```

**Key Properties:**
- `startTime`: Captured on first click, zone left edge
- `endTime`: Optional, zone right edge (drag to set, double-click to clear)
- Lines extend full width (from startTime to chart edge or endTime)
- Zones bounded between startTime and endTime

## File Structure

```
testudo-web/apps/web/src/
├── primitives/
│   ├── PositionZonePrimitive.ts      # Canvas rendering (IPanePrimitive)
│   └── PositionZonePrimitive.test.ts # 22 unit tests
├── components/chart/
│   ├── PositionDrawingTool.tsx       # State machine + orchestration
│   └── PositionHandleOverlay.tsx     # DOM handles + stats panel
└── utils/
    └── chart_manager.ts              # V5 API wrapper + primitive lifecycle
```

## Key Implementation Details

### Canvas Primitive (PositionZonePrimitive.ts)

```typescript
class PositionZonePrimitive implements ISeriesPrimitive<Time> {
  // Called by lightweight-charts on each frame
  paneViews(): IPrimitivePaneView[] {
    return [this._renderer];
  }

  // Price axis labels
  priceAxisViews(): IPrimitiveAxisView[] {
    return [this._entryAxisView, this._slAxisView, this._tpAxisView];
  }

  // Update levels and trigger repaint
  updateLevels(levels: PositionLevels): void {
    this._levels = levels;
    this._renderer.update(levels);
    this.requestUpdate();  // Triggers chart repaint
  }
}
```

### DOM Overlay (PositionHandleOverlay.tsx)

```typescript
// Re-position handles on chart movement
useEffect(() => {
  const unsubscribe = chartManager.subscribeCrosshairMove(() => {
    forceUpdate(n => n + 1);  // Triggers re-render
  });
  return unsubscribe;
}, [chartManager]);

// Convert price to Y coordinate for positioning
const entryY = chartManager.priceToCoordinate(levels.entry);
```

### State Persistence (TradeView.tsx)

```typescript
// State stored per market symbol
const positionsByMarket = useRef<Map<string, PersistedPositionState>>(new Map());

// key={market} ensures clean lifecycle on market switch
<PositionDrawingTool
  key={market}
  initialState={positionsByMarket.current.get(market)}
  onStateChange={(state) => positionsByMarket.current.set(market, state)}
/>
```
