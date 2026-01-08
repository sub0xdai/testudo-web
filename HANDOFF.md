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

## What's Been Done (Iterations 1-5)

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

### Iteration 5 - Price Alerts & Market Selector
| File | Purpose |
|------|---------|
| `src/hooks/usePriceAlerts.ts` | Price alert management with localStorage |
| `src/components/PriceAlerts.tsx` | Price alerts UI panel |
| `src/components/MarketSelector.tsx` | Dropdown for switching trading pairs |

#### Price Alerts
- Set alerts for when price goes above or below a target
- Quick-select buttons (+2%, +5%, -2%, -5% from current price)
- Alerts persist in localStorage across sessions
- Audio notification + toast when alert triggers
- Integrated as third tab in orders panel

#### Market Selector
- Dropdown with search functionality in MarketBar
- Shows SOL, BTC, ETH paired with USDC
- Market icons with fallback
- Keyboard navigation (Escape to close, Enter to select)
- Updates URL on market change (`/trade/SOL_USDC`, `/trade/BTC_USDC`, etc.)

#### Multi-Market Support
- Trade.tsx now accepts any valid market (SOL_USDC, BTC_USDC, ETH_USDC)
- Invalid markets redirect to SOL_USDC
- getMarkets() API with fallback to hardcoded list

### Iteration 6 - Trade Confirmation, Accessibility & Real-time Balances
| File | Purpose |
|------|---------|
| `src/components/ui/TradeConfirmationModal.tsx` | Modal for confirming orders over $1000 |
| `src/hooks/useBalances.ts` | Custom hook for balance management with WebSocket |

#### Trade Confirmation Modal
- Shows warning for orders exceeding $1000 threshold
- Displays order details: side, size, price, total, fees
- Focus trap within modal for keyboard users
- Keyboard support: Enter to confirm, Escape to cancel
- Proper ARIA attributes for accessibility

#### Accessibility Improvements
- Skip-to-content link for keyboard navigation
- ARIA labels on all interactive elements (inputs, buttons)
- `role="radio"` with `aria-checked` on Buy/Sell toggle
- `role="tablist"`, `role="tab"`, `role="tabpanel"` for Orders panel
- `role="region"` with `aria-label` on major sections
- `aria-live="polite"` on dynamic balance display
- Proper `htmlFor` and `id` linking on form inputs

#### Real-time Balance Updates
- Custom `useBalances` hook with WebSocket subscription
- Automatic reconnection with polling fallback (10s interval)
- Balance updates via WebSocket when backend supports it
- Graceful degradation to REST API polling

### Build Status
✅ **Build passes** - 0 TypeScript errors (121 modules)

---

## What's Remaining

### High Priority (Next Iteration)
1. **Dark/Light Theme Toggle** - User-selectable theme with system preference
2. **Notification Center** - Centralized notification history panel
3. **Quick Trade Mode** - One-click buy/sell at market price

### Medium Priority
4. **Performance Optimization** - React.memo on more components
5. **Unit Tests** - Component testing with React Testing Library
6. **E2E Tests** - Playwright for critical user flows

---

## Key Files Reference

```
src/
├── state/
│   └── TradesProvider.tsx     # Global state (loading, errors, connection)
├── hooks/
│   ├── useKeyboardShortcuts.ts # Keyboard shortcuts hook
│   ├── usePriceAlerts.ts      # Price alert management
│   └── useBalances.ts         # Balance management with WebSocket
├── utils/
│   ├── format.ts              # Number formatting utilities
│   ├── requests.ts            # API calls (axios) + balances/orders/markets
│   ├── ws_manager.ts          # WebSocket with exponential backoff
│   ├── types.ts               # TypeScript interfaces
│   └── chart_manager.ts       # Lightweight Charts wrapper
├── components/
│   ├── ui/
│   │   ├── Skeleton.tsx       # Loading skeletons
│   │   ├── BalanceDisplay.tsx # User balance display (uses useBalances)
│   │   ├── TradeConfirmationModal.tsx # Large order confirmation
│   │   ├── ConnectionStatus.tsx
│   │   └── ErrorBoundary.tsx
│   ├── MarketBar.tsx          # Price header + MarketSelector
│   ├── MarketSelector.tsx     # Trading pair dropdown
│   ├── PriceAlerts.tsx        # Price alert management UI
│   ├── Depth.tsx              # OrderBook + RecentTrades tabs
│   ├── depth/
│   │   └── OrderBook.tsx      # Order book with ARIA accessibility
│   ├── SwapInterface.tsx      # Buy/Sell form + confirmation modal
│   ├── OpenOrders.tsx         # Open orders with cancel
│   ├── OrderHistory.tsx       # Completed/cancelled orders
│   └── trade_interface/
│       └── TradeView.tsx      # Candlestick chart
└── pages/
    └── Trade.tsx              # Main trading page (skip-link, ARIA tabs)
```

---

## Continuation Prompt

Copy this to continue the Ralph loop:

```
Continue the Ralph loop for testudo-web frontend transformation.

Context:
- Read /home/m0xu/1-projects/testudo/testudo-web/HANDOFF.md for what's done
- Build should pass: `npm run build`

Next tasks (in order):
1. Add Dark/Light Theme Toggle - user-selectable theme with system preference detection
2. Add Notification Center - centralized notification history panel
3. Add Quick Trade Mode - one-click buy/sell at market price

Design principles:
- Loading skeletons for all async data
- Error states with retry buttons
- Proper number formatting (use src/utils/format.ts)
- Mobile-first responsive design
- No console.log in production code
- Memoize expensive computations
- ARIA accessibility on all interactive elements

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
