---
title: "FAQ & Troubleshooting"
description: "Common issues and how to resolve them."
order: 8
section: "trader"
---

## General

### My trades aren't showing on the dashboard

The Desk shows **closed trades** only. Active (open) positions appear at the top of the Trades page with a green pulsing indicator. Once a trade closes (stop-loss hit, take-profit reached, or manual close), it moves to the trade table with full P&L data.

### The import didn't bring in all my trades

Trade history import covers the last **90 days**. Trades older than 90 days are not available via exchange APIs. Also, only **closing fills** (perp trades with realized P&L) are imported — open positions and unfilled orders are excluded.

### My position sizing seems wrong

Check your risk configuration on the Account page. Position sizing is the minimum of four constraints:

1. **Account % risk** — Your configured risk percentage of balance
2. **Max risk amount** — Hard dollar cap per trade
3. **Max position size** — Hard cap in base currency
4. **Margin capacity** — Available balance divided by leverage requirements

If the calculated size is smaller than expected, one of these constraints is the bottleneck. The modal shows which one is active.

## Extension

### Alt+X doesn't do anything

- Make sure you're on a **TradingView** chart page (not the homepage or screener)
- Check that the extension is installed and enabled in your browser
- Try refreshing the page — the content script needs to inject on page load
- Ensure no other extension is capturing the Alt+X shortcut

### The scraper didn't read my position tool

The extension reads directly from TradingView's DOM using multiple fallback strategies. If it can't extract prices:

- Make sure you have a **Long Position** or **Short Position** tool drawn on the chart (not other drawing tools)
- Try double-clicking the position tool to open its properties dialog, then press Alt+X
- If all strategies fail, the modal opens with the symbol pre-filled — enter prices manually

### "Pair not found" when entering the code

The 6-digit pairing code expires after **5 minutes**. Generate a new code from the Desk Account page and try again. Make sure you're entering the code in the correct field in the extension popup.

### The extension popup is blank

- Check that you're logged in (paired with the Desk)
- Try closing and reopening the popup
- Check the browser console for errors (right-click extension icon > Inspect popup)
- Reinstall the extension if the issue persists

### Balance shows 0 or won't load

- Verify your exchange connection is active (green heartbeat on the Desk Account page)
- Try switching to a different exchange and back
- The balance fetch requires a working connection to your exchange — check that your API keys haven't expired

## Exchanges

### "Connection test failed"

- **API key expired**: Some exchanges expire API keys. Generate a new one.
- **IP restriction**: If you set an IP whitelist on your API key, make sure the Testudo server's IP is included.
- **Wrong permissions**: Ensure your API key has **futures/derivatives trading** enabled.
- **Exchange maintenance**: The exchange may be down. Check their status page.

### Hyperliquid agent wallet issues

- **"Approval failed"**: Make sure your main wallet is connected and on the correct network. The signing message uses Arbitrum Sepolia chain ID.
- **Agent wallet not working**: Try revoking and re-initializing from the exchange card's kebab menu.
- **"Account not found"**: Ensure your Hyperliquid account has been activated (has made at least one deposit or trade).

### OKX passphrase error

OKX requires three fields: API key, secret, **and passphrase**. The passphrase is set when you create the API key. If you forgot it, you'll need to create a new API key.

## Dashboard

### Charts are empty

- Check that you have trades in the selected time range (use the time preset buttons)
- Remove any active filters that might be hiding trades
- If you just imported history, wait a moment for analytics to compute

### Equity curve looks wrong

The equity curve is computed from cumulative net P&L of closed trades, ordered by close date. If you imported trades from multiple exchanges, they're interleaved by date. The curve reflects your actual closed P&L timeline.

### Stats show unexpected values

All statistics respect the active global filters. If you've filtered to a specific symbol, exchange, or date range, the stats reflect only that subset. Click "Clear" on the filter bar to see your full history.

## Journal

### Notes aren't saving

Notes auto-save when you click away from the editor (on blur). If you close the panel before clicking away, the note may not save. Wait for the save to complete before navigating.

### Export isn't working

The export feature downloads a `.md` file for the selected trade. Make sure your browser allows file downloads from the Desk domain. The **Export All** button on the Journal page downloads all entries as individual markdown files.
