---
title: "What is Testudo?"
description: "Automated risk management for crypto traders who use TradingView."
order: 1
section: "trader"
---

## The Problem

Most traders don't lose money because of bad entries. They lose money because of bad sizing.

A trader with a 60% win rate can still blow up their account if they risk 20% on every trade. Meanwhile, a trader with a 35% win rate can be consistently profitable — if every winner is 3x the size of every loser and each position is sized to survive a losing streak.

Risk management is the edge. But calculating position sizes by hand for every trade is slow, error-prone, and the first thing traders skip when they're in a rush.

## What Testudo Does

Testudo is an automated risk management overlay for crypto perpetual futures. It sits between you and your exchange, enforcing position sizing rules on every trade.

You draw your trade setup on a TradingView chart — entry, stop-loss, take-profit. Press **Alt+X**. Testudo calculates the exact position size based on your risk rules, places the entry order with a bracket (SL + TP), and tracks the trade through to close.

Every closed trade is logged automatically. You review your performance on the Desk dashboard — equity curves, win rate, expectancy, drawdown, R-multiples — all computed from real data.

## The Three Components

### The Extension

A browser extension that lives on your TradingView tab. When you press Alt+X, it reads your position tool (entry, stop, target) directly from the chart, sends it through the risk engine for sizing, and shows you a confirmation modal. Two presses of Enter and the order is on the exchange.

The extension popup shows your live balance, an exposure gauge, and all active positions.

### The Desk

A web dashboard at `/desk` where you review your trading performance. The Overview page shows your equity curve, P&L stats, win rate, profit factor, expectancy, and risk metrics. The Trades page is a sortable, filterable table of every closed trade with full detail panels. The Journal page lets you write trade theses, tag patterns, and export to markdown.

### Exchange Connections

Testudo connects to your exchange via API keys (for centralized exchanges like Binance, WOO, Bybit, OKX) or wallet signing (for Hyperliquid). All credentials are encrypted at rest with AES-256-GCM. Testudo never has withdrawal permissions — only trading.

## Who It's For

Retail day traders who:

- Trade crypto perpetual futures
- Use TradingView for charting
- Want systematic risk management without building their own tooling
- Care about tracking performance with real data, not gut feel

Testudo is not an algo bot. It doesn't generate signals or pick entries. You decide when and where to trade. Testudo makes sure you size it correctly and keeps a record of everything.

## The Name

The testudo (Latin: "tortoise") was the Roman legion's shield formation — interlocking shields creating an impenetrable defensive wall. Individual soldiers were vulnerable; the formation was not.

Same idea here. Individual trades will lose. The formation — proper sizing, defined risk, systematic review — protects the account.
