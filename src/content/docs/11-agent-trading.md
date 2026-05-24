---
title: "Agent Trading"
description: "How AI agents (Claude, Hermes, OpenClaw, pi) trade autonomously on Testudo."
order: 11
section: "technical"
---

AI coding agents can trade autonomously on Testudo using the same infrastructure that powers the browser extension and dashboard.

## Quick Start for Agents

If you're an AI agent reading this, your entry point is a single markdown file:

```
https://testudo.vip/AGENT_TRADING.md
```

Fetch it, parse it, follow the instructions. It covers everything: authentication, pre-trade research, signal submission, WebSocket monitoring, journal writes, and the complete autonomous trading loop with pseudocode.

```bash
# Agent — fetch the guide directly
curl -s https://testudo.vip/AGENT_TRADING.md
```

## Architecture

The agent pipeline has three layers, built across AGENT-01 through AGENT-03:

| Spec | Layer | Endpoints |
|------|-------|-----------|
| AGENT-01 | Signal execution | `POST /api/v1/signals` — submit trades with reasoning, confidence, and setup tags. Supports shadow (paper) and live modes. |
| AGENT-02 | Real-time alerts | WebSocket `agent.alert.{user_id}` and `agent.execution.{user_id}` — risk breaches, fill confirmations, wallet expiry. |
| AGENT-03 | Journal memory | `GET /api/v1/journal/agent/summary?format=llm` — performance history as LLM-ready markdown. `GET /api/v1/journal/agent/insights` — coach pattern detection. `POST /api/v1/journal/agent/compare` — period-over-period deltas. |

## The Agent's Loop

```
1. READ  → GET /api/v1/journal/agent/summary?format=llm (inject into context window)
2. CHECK → GET /api/v1/journal/agent/insights (coach warnings)
3. DECIDE → LLM reasons about the data, chooses trade or wait
4. EXECUTE → POST /api/v1/signals (with reasoning + confidence)
5. WRITE → POST /api/v1/journal/entries (pre-trade thesis), POST /api/v1/journal/trades/{id}/tags
6. MONITOR → WebSocket agent.execution.* and agent.alert.*
7. REPEAT → Next cycle reads updated performance data
```

## Key Design Decisions

**Shadow mode first.** Every agent starts with `"execution_mode": "shadow"` (paper trading). Switch to `"live"` only after a week of profitable shadow trading. The shadow engine simulates fills against live prices — no real money at risk.

**Tags are memory.** Every trade gets a `setup_tag` (`breakout`, `support_bounce`, `trend_follow`). Tags are how the journal groups performance by strategy. Consistency is everything — use the same tags session to session.

**Reasoning persists.** The `reasoning` field on every signal is stored in the journal. Six months from now, you can audit exactly why you took every trade. Write real reasoning, not templates.

**The coach warns.** The coach pipeline runs weekly pattern detection (sizing drift, frequency spikes, session anomalies, setup fatigue, correlation stacking, streak risk). Agents consume these warnings via `/api/v1/journal/agent/insights` and should adjust behavior accordingly.

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/v1/signals` | 30 | 60 seconds per user |

Rate limits exist to prevent runaway loops. One signal every 2 seconds is more than sufficient — crypto trades resolve in seconds to minutes.

## Supported Exchanges

| Exchange | Mode | Notes |
|----------|------|-------|
| Shadow (paper) | `shadow` | Internal engine, always available, no credentials |
| Hyperliquid | `live` | Native Rust SDK, requires agent wallet approval |
| Binance / Bybit / OKX | `live` | Via CEX sidecar, requires API keys |

## Idempotency

Every signal should include an `Idempotency-Key` header (UUID). If the same key is sent again, Testudo returns the cached result instead of placing a duplicate order. Safe retry on network errors.

## Getting Help

- **Full agent guide:** [AGENT_TRADING.md](/AGENT_TRADING.md) — the authoritative document for agents
- **API reference:** [10-api-reference](/docs/10-api-reference) — all REST and WebSocket endpoints
- **GitHub:** [github.com/sub0xdai/testudo](https://github.com/sub0xdai/testudo)
