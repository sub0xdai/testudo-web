# Testudo Frontend - Developer Handoff

## Quick Start

```bash
cd /home/m0xu/1-projects/testudo/testudo-web/apps/web
npm run build  # Should pass with 0 errors
npm run dev    # Start dev server on localhost:5173
```

---

## Project Context

**Testudo** is a cryptocurrency exchange frontend (React/TypeScript/Vite). We're transforming it from a rough prototype into a **world-class trading UI**.

### Tech Stack
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Lightweight Charts (TradingView-style)
- Sonner (toasts)
- WebSocket for real-time data

---

## What's Been Done (Iterations 1-4)

### Critical Bug Fixes
- **OrderBook cumulative size calculation** - Was broken (never reset between renders)
- **O(n²) → O(n) order book algorithm** - Now uses Map for updates
- **`$undefined` display** - Added proper loading skeletons everywhere

### New Infrastructure
| File | Purpose |
|------|---------|
| `src/utils/format.ts` | `formatPrice()`, `formatUSD()`, `formatQuantity()`, `formatTime()` |
| `src/components/ui/Skeleton.tsx` | Loading skeleton components |
| `src/components/ui/ConnectionStatus.tsx` | WebSocket status indicator |
| `src/components/ui/ErrorBoundary.tsx` | React error boundary |

### State Management Overhaul
`src/state/TradesProvider.tsx` now includes:
- `LoadingState` - Track loading per data source (ticker, orderBook, trades, chart)
- `ErrorState` - User-friendly error messages
- `ConnectionStatus` - 'connecting' | 'connected' | 'disconnected' | 'error'
- `isSubmitting` - Order submission state
- Memoized context value to prevent re-renders

### Components Fixed
- `MarketBar.tsx` - Loading skeletons, proper formatting, dynamic symbols
- `OrderBook.tsx` - Cumulative calculation in useMemo, loading states
- `Depth.tsx` - O(n) algorithm, error handling, proper cleanup
- `SwapInterface.tsx` - Submission loading, validation, success toasts
- `RecentTrades.tsx` - Loading skeletons, formatted values
- `TradeView.tsx` - Loading/error/empty states, more timeframes, retry button
- `Trade.tsx` - ConnectionBadge, mobile layout, proper user init, OpenOrders panel
- `App.tsx` - ErrorBoundary wrapper, enhanced Toaster

### Iteration 3 - Balances, Orders & WebSocket Reconnection
| File | Purpose |
|------|---------|
| `src/components/ui/BalanceDisplay.tsx` | User SOL/USDC balance display with loading/error states |
| `src/components/OpenOrders.tsx` | Open orders panel with cancel functionality |
| `src/utils/ws_manager.ts` | WebSocket manager with exponential backoff reconnection |

#### Balance Display
- Shows base and quote asset balances
- USD value calculation
- Loading skeleton state
- Error state with retry button
- Refresh button for manual update
- Displays locked amounts (in open orders)

#### Open Orders Panel
- Lists all open/partially-filled orders
- Cancel order functionality with loading state
- Auto-refresh every 5 seconds
- Fill progress indicator for partially-filled orders
- Loading skeleton state
- Error state with retry button
- Empty state messaging

#### WebSocket Reconnection
- Automatic reconnection with exponential backoff (1s → 2s → 4s → max 30s)
- Connection state management ('connecting' | 'connected' | 'disconnected' | 'error')
- State change callbacks for UI updates
- Auto-resubscribe to all channels on reconnect
- Message buffering during disconnection
- Force reconnect / disconnect methods

### Iteration 4 - Keyboard Shortcuts & Order History
| File | Purpose |
|------|---------|
| `src/hooks/useKeyboardShortcuts.ts` | Custom hook for keyboard shortcuts |
| `src/components/OrderHistory.tsx` | Completed/cancelled orders display |

#### Keyboard Shortcuts
- `Ctrl+B` - Switch to Buy mode and focus size input
- `Ctrl+S` - Switch to Sell mode and focus size input
- `Escape` - Clear form and blur inputs
- `Ctrl+Enter` - Submit order
- Keyboard hints shown below submit button (desktop only)
- Proper handling of inputs (shortcuts disabled when typing)

#### Order History
- Shows completed, cancelled, and expired orders
- Filter tabs: All / Filled / Cancelled
- Grouped by date for better organization
- Shows partial fill info for cancelled orders
- Loading skeleton and error states
- Integrated as tab alongside Open Orders

#### UI Improvements
- Orders panel now has tabs (Open Orders / Order History)
- Compact mini-headers inside each tab for filtering/refresh
- Increased panel height (250px mobile, 300px desktop)

### Build Status
✅ **Build passes** - 0 TypeScript errors

---

## What's Remaining

### High Priority (Next Iteration)
1. **Price Alerts** - Toast notification when price hits user-defined target
2. **Market Selector** - Dropdown to switch between trading pairs
3. **Trade Confirmation Modal** - Confirm before submitting large orders

### Medium Priority
4. **Accessibility Audit** - ARIA labels, focus management
5. **Multi-market Support** - Currently hardcoded to SOL_USDC
6. **Dark/Light Theme Toggle**

### Polish
7. **Performance Optimization** - React.memo on more components
8. **Unit Tests** - Component testing with React Testing Library
9. **E2E Tests** - Playwright for critical user flows

---

## Key Files Reference

```
src/
├── state/
│   └── TradesProvider.tsx     # Global state (loading, errors, connection)
├── hooks/
│   └── useKeyboardShortcuts.ts # Keyboard shortcuts hook
├── utils/
│   ├── format.ts              # Number formatting utilities
│   ├── requests.ts            # API calls (axios) + balances/orders
│   ├── ws_manager.ts          # WebSocket with exponential backoff
│   ├── types.ts               # TypeScript interfaces
│   └── chart_manager.ts       # Lightweight Charts wrapper
├── components/
│   ├── ui/
│   │   ├── Skeleton.tsx       # Loading skeletons
│   │   ├── BalanceDisplay.tsx # User balance display
│   │   ├── ConnectionStatus.tsx
│   │   └── ErrorBoundary.tsx
│   ├── MarketBar.tsx          # Price ticker header
│   ├── Depth.tsx              # OrderBook + RecentTrades tabs
│   ├── SwapInterface.tsx      # Buy/Sell form + balance + shortcuts
│   ├── OpenOrders.tsx         # Open orders with cancel
│   ├── OrderHistory.tsx       # Completed/cancelled orders
│   └── trade_interface/
│       └── TradeView.tsx      # Candlestick chart
└── pages/
    └── Trade.tsx              # Main trading page + tabbed orders
```

---

## Continuation Prompt

Copy this to continue the Ralph loop:

```
Continue the Ralph loop for testudo-web frontend transformation.

Context:
- Read /home/m0xu/1-projects/testudo/testudo-web/HANDOFF.md for what's done
- Read /home/m0xu/1-projects/testudo/testudo-web/.claude/ralph-loop.local.md for iteration history
- Build should pass: `npm run build`

Next tasks (in order):
1. Add Price Alerts - toast notification when price hits user-defined target
2. Add Market Selector - dropdown to switch between trading pairs (SOL_USDC, BTC_USDC)
3. Add Trade Confirmation Modal - confirm before submitting orders over $1000

Design principles:
- Loading skeletons for all async data
- Error states with retry buttons
- Proper number formatting (use src/utils/format.ts)
- Mobile-first responsive design
- No console.log in production code
- Memoize expensive computations

The goal is the slickest trading UX in the world.
```

---

## Design System

### Colors (tailwind.config.js)
```
positive-green: #34cb88 (buy, profit)
negative-red: #ff615c (sell, loss)
container-bg: #121212 (cards)
container-bg-hover: #1a1a1a
text-default: #e4e4e7
text-secondary: #a1a1aa
interactive-link: #60a5fa
```

### Patterns
- Use `formatUSD()` / `formatPrice()` / `formatQuantity()` from format.ts
- Use `<Skeleton />` for loading states
- Use `setLoading('key', true/false)` from TradesContext
- Use `setError('key', message)` for error states
- Wrap risky components in `<ErrorBoundary>`

---

## Backend API (for reference)

```
REST: http://localhost:8080/api/v1
  GET  /depth?symbol=SOL_USDC
  GET  /trades?symbol=SOL_USDC
  GET  /tickers
  GET  /klines?symbol=SOL_USDC&interval=1m&startTime=<ts>
  POST /order
  POST /users

WebSocket: ws://localhost:4000
  Subscribe: { method: "SUBSCRIBE", params: ["depth.SOL_USDC"] }
  Subscribe: { method: "SUBSCRIBE", params: ["trade.SOL_USDC"] }
```

---

## Testing Checklist

Before marking iteration complete:
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No console.log statements
- [ ] Loading states work (throttle network to test)
- [ ] Error states work (disconnect backend to test)
- [ ] Mobile layout works (resize to 375px width)
