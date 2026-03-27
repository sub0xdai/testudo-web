---
title: "The Dashboard"
description: "Equity curves, P&L analytics, risk metrics, and performance tracking."
order: 5
section: "trader"
---

The Desk is your trading performance hub. It lives at `/desk` and shows everything about your trading history — computed automatically from real trade data.

## Overview

The Overview page is the first thing you see after logging in. It's split into three sections.

### Hero Metrics

At the top: your **Net P&L** (large, color-coded green or red) and **average R-Multiple**. These are the two numbers that matter most.

### Stats Sidebar

The left sidebar (desktop only) shows three groups of metrics:

**Account**
- Total P&L (gross)
- Net P&L (after fees)
- Fees paid
- Total trade count

**Performance**
- Win Rate (%)
- Profit Factor
- Expectancy (average P&L per trade)
- Average R-Multiple
- Trades per day

**Risk**
- Max Drawdown (%)
- Worst Day (P&L)
- Worst Week (P&L)
- Current Streak (wins or losses in a row)
- Best Streak

### Charts

The main area shows your **equity curve** — a line chart of cumulative P&L over time with a drawdown area overlay beneath it.

Below the equity curve, two chart selectors let you choose from 11 chart types:

- **Symbol Distribution** — Donut chart showing which symbols you trade most
- **P&L Treemap** — Hierarchical view of P&L by symbol
- **Expectancy by Symbol** — Bar chart of average P&L per symbol
- **Daily P&L** — Green/red histogram of daily profit and loss
- **Cumulative Profit** — Line chart of running total
- **Drawdown** — Area chart showing recovery patterns
- **Holding Period** — Distribution of how long you hold trades
- **Duration vs. Profitability** — Scatter plot of trade duration against P&L
- **Return Distribution** — Histogram of trade returns bucketed by size
- **Time Heatmap** — Day-of-week by hour grid showing when you trade best

## Trades

The Trades page shows a sortable table of every closed trade.

### Columns

| Column | What it shows |
|---|---|
| DATE | When the trade closed |
| SYMBOL | Trading pair (e.g., BTCUSDT) |
| EXCH | Exchange (WOO, Binance, HL, etc.) |
| SIDE | BUY or SELL |
| ENTRY | Entry price |
| EXIT | Exit price |
| NET P&L | Profit or loss after fees (green/red) |
| R | R-multiple for the trade |
| DURATION | How long the position was open |
| TAGS | Color-coded category badges |

Click any row to open the **trade detail panel** on the right side.

### Trade Detail Panel

The detail panel shows everything about a single trade:

- Full date range and duration
- Price grid: entry, exit, stop-loss, take-profit, quantity, leverage
- P&L breakdown: net P&L, R-multiple, fees, return percentage
- **Tags**: Add, remove, and create tags for categorization
- **Notes**: Markdown editor with live preview. Write your analysis, save on blur.
- **Export**: Download as a `.md` file with YAML frontmatter

### Active Positions

At the top of the Trades page, any currently open positions appear with a green pulsing indicator. Click one to write a thesis while the trade is still live.

### Filtering

Use the filter controls to narrow the view:

- **Time presets**: Always visible (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
- **Exchange**: Filter to a specific exchange
- **Symbol**: Search and select a specific pair
- **Side**: All, BUY, or SELL
- **Tag**: Filter by tag

Filters are global — they apply across Overview charts, the trade table, and analytics.

### Pagination

Trades are paginated at 50 per page. Total count is shown above the table.

## Mobile

On mobile, the sidebar stats collapse into a condensed strip showing the key numbers (Net P&L, R-Multiple, Expectancy, Win Rate, Profit Factor, Trade count) in a single scrollable row. Charts stack vertically.
