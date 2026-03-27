---
title: "Core Concepts"
description: "Position sizing, R-multiples, expectancy, and the math behind risk management."
order: 2
section: "trader"
---

These are the concepts Testudo is built on. Each one is simple on its own. Together, they form a complete framework for managing risk.

## Position Sizing

**What it is:** Calculating how large a position to take based on how much you're willing to lose if the trade hits your stop-loss.

**Why it matters:** Position sizing is the single most important variable in trading. Two traders can take the exact same entries and exits, but if one risks 1% per trade and the other risks 15%, they'll have completely different outcomes.

**The formula:**

$$\text{position size} = \frac{\text{account balance} \times \text{risk percent}}{\text{stop distance}}$$

Where stop distance is the difference between your entry price and stop-loss price:

$$\text{stop distance} = |\text{entry price} - \text{stop loss price}|$$

**Example:** You have a \$10,000 account and risk 2% per trade. You want to long BTC at \$50,000 with a stop-loss at \$49,000.

- Risk amount = \$10,000 x 2% = **\$200**
- Stop distance = \$50,000 - \$49,000 = **\$1,000**
- Position size = \$200 / \$1,000 = **0.2 BTC**

If BTC hits your stop, you lose exactly \$200 — 2% of your account. If it goes to your target, the reward depends on how far that target is.

### Conservative Wins

Testudo doesn't just calculate one number. It computes four constraints and takes the **smallest**:

$$\text{final size} = \min\left(\text{size}_{\text{risk\%}},\; \text{size}_{\text{max risk}},\; \text{size}_{\text{max position}},\; \text{size}_{\text{margin}}\right)$$

| Constraint | What it limits |
|---|---|
| Account % risk | Size from your configured risk percentage |
| Max risk amount | Hard dollar cap on risk per trade (e.g., never risk more than \$150) |
| Max position size | Hard cap on position size in base currency |
| Margin capacity | Ensures you have enough margin at your leverage level |

The most conservative constraint always wins. This prevents oversizing even when individual limits seem fine.

## R-Multiples

**What it is:** A way to measure every trade in units of risk — regardless of position size.

**Why it matters:** R-multiples normalize your results. A \$500 win on a \$250 risk is the same quality trade as a \$50 win on a \$25 risk. Both are +2R.

**The formula:**

$$R = \frac{\text{net P\&L}}{\text{risk amount}}$$

**Examples:**

| Risk Amount | Net P&L | R-Multiple | Meaning |
|---|---|---|---|
| \$100 | +\$250 | +2.5R | Won 2.5x what you risked |
| \$100 | -\$100 | -1.0R | Full stop-loss hit |
| \$100 | -\$50 | -0.5R | Partial loss (moved stop) |
| \$200 | +\$600 | +3.0R | Big winner, 3x risk |

When you review trades in R-multiples, you're looking at the quality of the trade — not the dollar amount. A +0.3R trade is mediocre regardless of whether it made \$30 or \$3,000.

## Expectancy

**What it is:** Your average R per trade across your entire history. The single number that tells you whether your trading system makes money.

**Why it matters:** Positive expectancy means you're profitable over a large sample. Negative expectancy means you're losing — even if you're "winning" most trades.

**The formula:**

$$E = (W \times \bar{R}_w) - (L \times \bar{R}_l)$$

Where:
- $W$ = win rate (as a decimal)
- $\bar{R}_w$ = average R on winning trades
- $L$ = loss rate ($1 - W$)
- $\bar{R}_l$ = average R on losing trades (absolute value)

**Example:** You win 40% of the time at an average of +2.0R, and lose 60% of the time at an average of -1.0R.

$$E = (0.40 \times 2.0) - (0.60 \times 1.0) = 0.80 - 0.60 = +0.20R$$

This means on average, every trade you take earns +0.2R. Over 100 trades risking \$100 each, that's \$2,000 in profit — despite losing more than half.

## Profit Factor

**What it is:** The ratio of total gross profit to total gross loss.

**The formula:**

$$PF = \frac{\text{gross profit}}{\text{gross loss}}$$

| Profit Factor | Interpretation |
|---|---|
| < 1.0 | Losing money |
| 1.0 - 1.5 | Marginally profitable |
| 1.5 - 2.0 | Solid edge |
| > 2.0 | Strong edge |

A profit factor of 1.5 means for every dollar you lose, you make \$1.50 back. Simple and intuitive.

## Maximum Drawdown

**What it is:** The largest peak-to-trough decline in your account equity.

**Why it matters:** Drawdown tells you how much pain your system delivers. A 50% drawdown means you need a 100% gain just to get back to even. Knowing your max drawdown helps you decide if you can psychologically survive your system's losing streaks.

$$\text{drawdown} = \frac{\text{peak equity} - \text{current equity}}{\text{peak equity}} \times 100$$

If your equity peaked at \$12,000 and dropped to \$10,200, your drawdown is:

$$\frac{12{,}000 - 10{,}200}{12{,}000} \times 100 = 15\%$$

Testudo tracks this automatically and can block new trades if you exceed a daily drawdown limit (configurable — default is 5%).

## Win Rate vs. Edge

**The counterintuitive truth:** Win rate alone means nothing.

A system that wins 70% of the time can lose money. A system that wins 30% of the time can be highly profitable. What matters is the relationship between win rate and average win/loss size.

| Win Rate | Avg Win (R) | Avg Loss (R) | Expectancy |
|---|---|---|---|
| 70% | +0.3R | -1.0R | -0.09R (losing!) |
| 50% | +1.5R | -1.0R | +0.25R |
| 40% | +2.0R | -1.0R | +0.20R |
| 30% | +3.0R | -1.0R | +0.20R |
| 20% | +5.0R | -1.0R | +0.20R |

The 70% win rate system is the only loser in this table — because the average win is too small relative to the average loss. This is why Testudo tracks R-multiples, not just win/loss counts.

High win rate feels good. Positive expectancy *is* good.
