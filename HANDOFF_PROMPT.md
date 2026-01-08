# Testudo Frontend - AI Engineer Handoff Prompt

Copy and paste this to the next Claude session:

---

## Context

You are continuing work on **Testudo**, a high-performance crypto trading platform frontend. The previous engineer implemented:

1. **Imperial Roman Theme** - "The Senate meets the Terminal" aesthetic
2. **Iteration 6 Features** - Trade confirmation modal, accessibility, real-time balances

## Codebase Location

```
/home/m0xu/1-projects/testudo/testudo-web/apps/web
```

## Current State

- **Build**: ✅ Passes (`npm run build`)
- **Dev Server**: `npm run dev` → http://localhost:5173/trade/SOL_USDC
- **Backend**: Not running (use DEV_FALLBACK_PRICE = $200 for testing)

## Design System - Imperial Roman

| Element | Value |
|---------|-------|
| Background | Obsidian #0a0a0c, Slate #121214 |
| Accent | Antiqued Gold #c5a059 |
| Buy/Acquire | Laurel Green #3a7f5d |
| Sell/Liquidate | Tyrian Red #990011 |
| Text | Marble #f5f5f0 |
| Headers | Cinzel (serif, uppercase, tracked) |
| Data | JetBrains Mono |
| Corners | 0px (sharp 90°) |
| Inputs | Transparent + gold underline |
| Buttons | Metallic gradients |

## Key Files

```
src/
├── index.css              # Imperial CSS classes (.panel-imperial, .btn-acquire, etc.)
├── tailwind.config.js     # Imperial color palette
├── components/
│   ├── SwapInterface.tsx  # Order entry (ACQUIRE/LIQUIDATE)
│   ├── MarketBar.tsx      # Price header with gold accents
│   ├── depth/OrderBook.tsx # Needs imperial styling
│   └── ui/
│       └── TradeConfirmationModal.tsx
└── hooks/
    └── useBalances.ts     # WebSocket + polling for balances
```

## Immediate Tasks (Iteration 7)

### 1. OrderBook Imperial Styling
The OrderBook still uses old styling. Apply:
- `.panel-imperial` container
- Gold border accents
- Serif "ORDERBOOK" header
- Keystone shape for spread visualization (CSS clip-path)
- Low-opacity tortoise watermark when empty

### 2. Connection Status Redesign
Move "Disconnected" banner to a discreet gold indicator in the header (top-right corner).

### 3. Chart Area Styling
- Apply imperial border to chart container
- Add gold accent line at top
- Serif "TRADINGVIEW" label (or remove label entirely)

### 4. Orders Panel Tabs
Apply imperial styling to the Open Orders / Order History / Price Alerts tabs:
- Gold underline on active tab
- Serif font for tab labels
- Imperial border on panel

## Design Principles

1. **Sharp angles** - No rounded corners. Ever.
2. **Gold accents** - Borders, focus states, separators
3. **Serif authority** - Cinzel for all headers/labels
4. **Monospace precision** - JetBrains Mono for all numbers
5. **Muted semantics** - Green/Red are regal, not neon
6. **Inscriptions over boxes** - Inputs use underlines, not borders

## CSS Classes Available

```css
.panel-imperial      /* Container with gold border */
.imperial-header     /* Cinzel, uppercase, tracked */
.imperial-inscription /* Gold Cinzel text */
.imperial-data       /* JetBrains Mono, tabular-nums */
.btn-acquire         /* Metallic green gradient */
.btn-liquidate       /* Metallic red gradient */
.input-imperial      /* Gold underline input */
.divider-imperial    /* Gradient gold separator */
```

## Commands

```bash
cd /home/m0xu/1-projects/testudo/testudo-web/apps/web
npm run dev      # Start dev server
npm run build    # Verify build
npm run lint     # Check linting (some pre-existing errors in chart_manager.ts)
```

## What NOT to Change

- Keep ACQUIRE/LIQUIDATE terminology
- Keep sharp corners (0px border-radius)
- Keep gold as primary accent
- Keep serif headers
- Don't add rounded corners "for accessibility" - sharp is intentional

## Reference

See `HANDOFF.md` for full iteration history and remaining tasks.

---

**Start by**: Reading `tailwind.config.js` and `src/index.css` to understand the design system, then apply imperial styling to the OrderBook component.
