---
title: "The Journal"
description: "Write trade theses, review outcomes, tag patterns, and export to markdown."
order: 6
section: "trader"
---

The Journal is where you build your edge over time. Every trade tells a story — the journal is where you write it down, review it later, and find the patterns that matter.

## The Thesis-First Approach

The most valuable thing you can do as a trader is write down *why* you're taking a trade *before* you take it.

When you have an active position, the trade detail panel shows a green "Active trade — write your thesis" prompt. Write your reasoning: What setup do you see? What's your edge? What would invalidate the thesis?

After the trade closes, you come back and compare: What actually happened vs. what you expected? This is where real learning happens.

## Journal Entries

The Journal page at `/desk/journal` supports five entry types:

| Type | Purpose |
|---|---|
| **Note** | Free-form journaling — anything on your mind |
| **Pre-Trade** | Thesis before entry (linked to an active position) |
| **Post-Trade** | Post-mortem after close |
| **Daily Review** | End-of-day recap |
| **Weekly Review** | End-of-week reflection |

Each entry has a title, body (markdown), and optional link to a specific trade.

## Collections

Organize entries into collections — filtered groups that help you find what you're looking for. The sidebar shows:

- **All Entries** (default view)
- Custom collections you create with saved filters

Collections persist via localStorage. Create as many as you need — "Winning Setups", "Mistakes", "Scalps", "Trend Following", etc.

## Tags

Tags let you categorize trades by pattern, strategy, or any label that's useful to you.

**Adding tags**: Open any trade's detail panel, click "+ Add" in the Tags section, and select an existing tag or create a new one.

**Managing tags**: The Tag Manager (accessible from the Journal page) lets you create, rename, delete, and color-code tags.

**Filtering by tag**: Use the tag dropdown on the Trades page or Journal page to show only trades/entries matching a specific tag.

Example tags:
- `support-bounce`, `trend-follow`, `reversal`, `breakout`
- `scalp`, `swing`, `position`
- `mistake`, `revenge-trade`, `A+ setup`

## View Modes

The Journal page offers two views:

**Table View** — A database-style table with columns for date, title, type, tags, and body preview. Click a row to edit.

**Cards View** — Entries grouped by date in a timeline layout. Each card shows the title, type badge, trade link (if any), and body preview with edit/delete buttons.

## Markdown Export

Every trade can be exported as a standalone `.md` file with YAML frontmatter:

```markdown
---
symbol: BTCUSDT
side: LONG
entry: 50000.00
exit: 52500.00
net_pnl: 500.00
r_multiple: 2.5
date: 2026-03-15
---

## Thesis
Saw a double bottom at the daily support level...

## Notes
Moved stop to break-even after first target hit...
```

The Journal page also has an **Export All** button for bulk download.

## Building a Track Record

The journal isn't just about individual trades. Over weeks and months, it becomes your most valuable asset:

- **Pattern recognition**: Tags reveal which setups work and which don't
- **Emotional awareness**: Reading old entries surfaces recurring mistakes
- **Strategy evolution**: Daily and weekly reviews track how your approach changes
- **Accountability**: Written records prevent revisionist history about "what you meant to do"

The traders who improve fastest are the ones who review. The journal makes reviewing systematic.
