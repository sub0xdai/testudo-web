---
title: "Getting Started"
description: "Connect your wallet, add exchanges, and pair the browser extension."
order: 3
section: "trader"
---

Setting up Testudo takes about five minutes. There are four steps, and the onboarding stepper on the Desk will guide you through each one.

## Step 1: Connect Your Wallet

Go to the Desk at `/desk`. You'll see a "Connect Wallet" button.

Testudo uses **Sign In with Ethereum (SIWE)** — no email, no password. Your wallet address is your identity. Click connect, approve the signature request in MetaMask (or your preferred wallet), and you're logged in.

Your session persists via secure HttpOnly cookies. You won't need to re-sign unless the session expires (7 days).

## Step 2: Add an Exchange

Navigate to the **Account** page on the Desk. Click **Add Exchange** and select your exchange from the dropdown:

- **Hyperliquid** — Connect via wallet signing (agent wallet). No API keys needed.
- **Binance** — API key + secret. Requires futures trading permission.
- **WOO** — API key + secret. Requires futures permission.
- **Bybit** — API key + secret. Requires derivatives permission.
- **OKX** — API key + secret + passphrase.

For centralized exchanges (CEX), enter your API credentials. Testudo encrypts them with AES-256-GCM before storing. The connection is validated immediately — you'll see a green heartbeat indicator if it succeeds.

For Hyperliquid (DEX), you'll go through an agent wallet flow: Testudo generates a dedicated trading key, you approve it on-chain, and it handles order execution without exposing your main wallet's private key.

> Only grant trading permissions. Testudo never needs withdrawal access.

## Step 3: Import Trade History

When you add an exchange, Testudo automatically starts importing your recent trade history (last 90 days). You can also trigger this manually from the exchange card's kebab menu and selecting **Import History**.

The import runs in the background. Once complete, your trades appear on the Desk — with P&L, R-multiples, and analytics computed automatically.

Supported exchanges for history import:
- **Hyperliquid** — Closing fills via native API
- **Binance** — Trade history via REST API
- **Bybit** — Trade history via REST API
- **WOO** — Trade history via REST API

## Step 4: Install and Pair the Extension

Install the **Testudo Sniper** extension from the Chrome Web Store (Firefox also supported).

To pair the extension with your Desk account:

1. On the Desk **Account** page, click **Pair Extension**
2. A 6-digit code appears (valid for 5 minutes)
3. Open the extension popup and enter the code
4. The extension is now authenticated and connected to your account

Once paired, the extension uses your active exchange for live balance display and trade execution. You can switch between exchanges from the extension popup header.

## What's Next

With all four steps complete, you're ready to trade:

- [The Extension](/docs/04-extension) — Learn the Alt+X workflow for placing trades from TradingView
- [The Dashboard](/docs/05-dashboard) — Understand your performance analytics
- [The Journal](/docs/06-journal) — Start documenting your trade theses
