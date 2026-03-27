---
title: "Exchange Setup"
description: "API key configuration for Hyperliquid, WOO, Binance, Bybit, and OKX."
order: 7
section: "trader"
---

Testudo connects to your exchange to execute trades, fetch balances, and import trade history. Each exchange has a slightly different setup process.

All credentials are encrypted with AES-256-GCM before storage. Testudo only needs trading permissions — never grant withdrawal access.

## Hyperliquid (DEX)

Hyperliquid uses wallet-based authentication instead of API keys.

### Setup

1. On the Desk Account page, click **Add Exchange** and select **Hyperliquid**
2. Click **Connect Wallet** — this triggers a wallet connection via WalletConnect
3. Testudo generates an **agent wallet** — a dedicated trading key that acts on your behalf
4. Your main wallet signs an on-chain approval authorizing the agent wallet
5. The agent wallet handles all order execution without exposing your main wallet's private key

### What's an Agent Wallet?

Think of it as a valet key for your car. It can drive (execute trades) but can't access the trunk (withdraw funds). If you revoke it, the agent wallet immediately loses all permissions.

### Revoking Access

From the exchange card's kebab menu, select **Revoke Agent**. This immediately disables the agent wallet on-chain. You can re-initialize a new agent wallet at any time.

## Binance

### API Key Setup

1. Log in to [Binance](https://www.binance.com) and go to **API Management**
2. Create a new API key with a descriptive label (e.g., "Testudo Trading")
3. Enable **Futures Trading** permission
4. **Do not** enable withdrawals or universal transfer
5. Optionally restrict to your IP address for extra security
6. Copy the API key and secret

### Adding to Testudo

1. On the Desk Account page, click **Add Exchange** and select **Binance**
2. Enter your API key and secret
3. Testudo validates the connection by fetching your futures balance
4. A green heartbeat indicator confirms the connection is active

## WOO

### API Key Setup

1. Log in to [WOO X](https://x.woo.org) and go to **API Keys** in settings
2. Create a new API key
3. Enable **Futures** permissions
4. **Do not** enable withdrawal permissions
5. Copy the API key and secret

### Adding to Testudo

1. On the Desk Account page, click **Add Exchange** and select **WOO**
2. Enter your API key and secret
3. Testudo validates the connection by fetching your balance
4. Green heartbeat confirms success

## Bybit

### API Key Setup

1. Log in to [Bybit](https://www.bybit.com) and go to **API Management**
2. Create a new API key (select "System-generated API Keys")
3. Enable **Derivatives** trading permission
4. Set permissions to **Read-Write** for derivatives
5. **Do not** enable withdrawal, transfer, or spot trading permissions
6. Optionally restrict to your IP address
7. Copy the API key and secret

### Adding to Testudo

1. On the Desk Account page, click **Add Exchange** and select **Bybit**
2. Enter your API key and secret
3. Testudo validates by fetching your derivatives balance
4. Green heartbeat confirms success

## OKX

### API Key Setup

1. Log in to [OKX](https://www.okx.com) and go to **API Keys** under account settings
2. Create a new API key
3. Set permissions to **Trade** only
4. **Do not** enable withdrawal permissions
5. Set a **passphrase** (required by OKX — you'll need this in Testudo)
6. Copy the API key, secret, and passphrase

### Adding to Testudo

1. On the Desk Account page, click **Add Exchange** and select **OKX**
2. Enter your API key, secret, and passphrase (all three required)
3. Testudo validates the connection
4. Green heartbeat confirms success

## Testing Your Connection

After adding an exchange, you can verify it's working from the exchange card:

1. Click the kebab menu (three dots) on the exchange card
2. Select **Test Connection**
3. You'll see either a green latency reading (e.g., "245ms") or a red error message

## Importing Trade History

When you add an exchange, Testudo automatically imports your last 90 days of trade history. To manually trigger an import:

1. Click the kebab menu on the exchange card
2. Select **Import History**
3. The button shows "IMPORTED" with a checkmark once complete

Imported trades appear on the Desk with full analytics — P&L, R-multiples, equity curve, everything.

## Removing an Exchange

From the kebab menu, select **Delete**. You'll be asked to confirm. Removing an exchange deletes the stored credentials but does not affect your trade history on the Desk.
