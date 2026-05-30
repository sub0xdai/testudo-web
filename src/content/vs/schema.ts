/** @anchor ui:web:schema
 * @tags ui */

/**
 * Programmatic SEO: Versus page data schema
 * Each entry generates a /vs/[slug] page comparing Testudo's local client
 * against a specific exchange's web interface.
 */

export interface VsPageData {
  /** URL slug: /vs/{slug} */
  slug: string
  /** Exchange display name */
  exchange: string
  /** Exchange type */
  type: 'dex' | 'cex'
  /** Chain/network (for DEX) */
  chain?: string
  /** Exchange web UI URL */
  webUrl: string
  /** SEO title */
  title: string
  /** Meta description */
  metaDescription: string
  /** H1 headline */
  headline: string
  /** Subheadline */
  subheadline: string

  /** Speed comparison data */
  speed: {
    /** Steps to execute a sized trade on exchange web UI */
    exchangeSteps: number
    /** Estimated seconds for full workflow on exchange */
    exchangeSeconds: number
    /** Specific pain points of the exchange UI */
    exchangePainPoints: string[]
    /** Testudo Alt+X time (always ~0.8s) */
    testudoSeconds: number
  }

  /** Sizing comparison */
  sizing: {
    /** Does exchange have built-in position size calculator? */
    hasCalculator: boolean
    /** Does it factor in stop distance? */
    factorsStopDistance: boolean
    /** Does it enforce account risk %? */
    enforcesRiskPercent: boolean
    /** Can it do bracket orders (entry + SL + TP) in one action? */
    bracketOrders: boolean
    /** Exchange-specific sizing limitations */
    limitations: string[]
  }

  /** Journaling / analytics */
  journal: {
    /** Does exchange have trade history export? */
    hasExport: boolean
    /** Format of export */
    exportFormat?: string
    /** Does it calculate R-multiples? */
    rMultiples: boolean
    /** Does it show equity curve? */
    equityCurve: boolean
    /** Does it have expectancy calculation? */
    expectancy: boolean
  }

  /** Reliability comparison */
  reliability: {
    /** Known outage/lag issues */
    knownIssues: string[]
    /** Does web UI lag during high volatility? */
    lagsDuringVolatility: boolean
    /** Browser tab memory consumption */
    heavyBrowserTab: boolean
  }

  /** Exchange-specific arguments (unique content per page) */
  uniqueArguments: string[]

  /** CTA text */
  ctaText: string
}

export const vsPages: VsPageData[] = [
  {
    slug: 'hyperliquid-web',
    exchange: 'Hyperliquid',
    type: 'dex',
    chain: 'Arbitrum',
    webUrl: 'https://app.hyperliquid.xyz',
    title: 'Testudo vs Hyperliquid Web UI — Why a Local Client Wins',
    metaDescription: 'Compare trading on Hyperliquid\'s web interface vs Testudo\'s TradingView extension. Position sizing, bracket orders, and execution speed compared.',
    headline: 'HYPERLIQUID WEB UI VS. LOCAL CLIENT',
    subheadline: 'You draw on TradingView anyway. Why switch tabs to execute?',
    speed: {
      exchangeSteps: 7,
      exchangeSeconds: 15,
      exchangePainPoints: [
        'Switch from TradingView to Hyperliquid tab',
        'Manually calculate position size from stop distance',
        'Type quantity, set leverage, set order type',
        'Place entry order, then separately set SL and TP',
        'No bracket orders — SL and TP are separate actions',
        'Wallet confirmation popup for each order',
      ],
      testudoSeconds: 0.8,
    },
    sizing: {
      hasCalculator: false,
      factorsStopDistance: false,
      enforcesRiskPercent: false,
      bracketOrders: false,
      limitations: [
        'No position size calculator — you enter raw quantity',
        'No risk-per-trade enforcement',
        'Stop-loss must be placed as separate trigger order',
        'Take-profit must be placed as separate limit order',
        'No "conservative wins" multi-constraint sizing',
      ],
    },
    journal: {
      hasExport: true,
      exportFormat: 'CSV',
      rMultiples: false,
      equityCurve: false,
      expectancy: false,
    },
    reliability: {
      knownIssues: [
        'Web UI slows during high-volume events (token launches, liquidation cascades)',
        'WebSocket disconnects require page refresh',
        'Order book rendering lags with deep liquidity',
      ],
      lagsDuringVolatility: true,
      heavyBrowserTab: true,
    },
    uniqueArguments: [
      'Hyperliquid\'s web UI is optimized for simple market/limit orders — not for risk-managed bracket execution from chart analysis.',
      'Agent wallet support means Testudo never touches your main wallet private key. Revoke anytime.',
      'Testudo\'s WebSocket connection to Hyperliquid uses native tokio-tungstenite — not the browser\'s WebSocket API. Direct, persistent, no tab-refresh required.',
      'Every trade routed through Testudo is automatically logged with R-multiple, duration, and P&L. Hyperliquid\'s trade history is a raw CSV with no analytics.',
    ],
    ctaText: 'TRADE HYPERLIQUID WITH ALT+X',
  },
  {
    slug: 'binance-futures-web',
    exchange: 'Binance Futures',
    type: 'cex',
    webUrl: 'https://www.binance.com/en/futures',
    title: 'Testudo vs Binance Futures Web — Position Sizing That Actually Works',
    metaDescription: 'Why Binance Futures\' web interface isn\'t enough for serious risk management. Compare execution speed, position sizing, and trade journaling.',
    headline: 'BINANCE FUTURES WEB VS. LOCAL CLIENT',
    subheadline: 'Binance has a position calculator. It doesn\'t use your stop distance.',
    speed: {
      exchangeSteps: 9,
      exchangeSeconds: 20,
      exchangePainPoints: [
        'Switch from TradingView to Binance tab',
        'Open position calculator (buried in UI)',
        'Enter margin, leverage — but not stop distance',
        'Calculator gives quantity, not risk-adjusted size',
        'Manually enter quantity in order form',
        'Set order type, price, leverage',
        'Place entry, then navigate to set SL/TP separately',
        'SL/TP UI is a separate panel with its own form',
        'Confirm each order individually',
      ],
      testudoSeconds: 0.8,
    },
    sizing: {
      hasCalculator: true,
      factorsStopDistance: false,
      enforcesRiskPercent: false,
      bracketOrders: false,
      limitations: [
        'Position calculator exists but doesn\'t factor stop distance',
        'Calculates max position from margin — not risk per trade',
        'No way to enforce "risk 1% of account per trade"',
        'Bracket orders not available from the calculator',
        'SL and TP must be placed after entry fills',
      ],
    },
    journal: {
      hasExport: true,
      exportFormat: 'CSV/Excel',
      rMultiples: false,
      equityCurve: false,
      expectancy: false,
    },
    reliability: {
      knownIssues: [
        'Web UI overloaded during major market events (May 2021, FTX collapse)',
        'API rate limits can delay order placement',
        'Complex UI with many panels competing for attention',
      ],
      lagsDuringVolatility: true,
      heavyBrowserTab: true,
    },
    uniqueArguments: [
      'Binance\'s position calculator answers "how much can I buy?" — Testudo answers "how much should I risk?" These are fundamentally different questions.',
      'Binance requires you to manage SL/TP as separate orders after entry. Testudo places the entire bracket atomically.',
      'Binance\'s web UI is designed for every type of trader. Testudo is designed for one workflow: chart analysis → risk-managed execution.',
      'Trade history on Binance is transactional (fills, fees, funding). Testudo groups fills into logical trades with R-multiples and duration.',
    ],
    ctaText: 'SIZE YOUR BINANCE TRADES PROPERLY',
  },
  {
    slug: 'bybit-web',
    exchange: 'Bybit',
    type: 'cex',
    webUrl: 'https://www.bybit.com/trade/usdt/BTCUSDT',
    title: 'Testudo vs Bybit Web — From TradingView to Exchange in One Keystroke',
    metaDescription: 'Bybit\'s web trading interface vs Testudo\'s Alt+X execution. Speed, position sizing, and automated journaling compared.',
    headline: 'BYBIT WEB UI VS. LOCAL CLIENT',
    subheadline: 'Bybit has charts. You use TradingView. Bridge the gap.',
    speed: {
      exchangeSteps: 8,
      exchangeSeconds: 18,
      exchangePainPoints: [
        'Bybit has built-in charts but most serious traders use TradingView',
        'Switch tabs to place orders',
        'No risk-based position sizing',
        'Manual quantity entry',
        'SL/TP as separate order modifications',
        'Multiple confirmation dialogs',
      ],
      testudoSeconds: 0.8,
    },
    sizing: {
      hasCalculator: false,
      factorsStopDistance: false,
      enforcesRiskPercent: false,
      bracketOrders: false,
      limitations: [
        'No position size calculator',
        'No risk percentage enforcement',
        'Conditional orders (SL/TP) placed after entry',
        'No bracket order workflow',
      ],
    },
    journal: {
      hasExport: true,
      exportFormat: 'CSV',
      rMultiples: false,
      equityCurve: false,
      expectancy: false,
    },
    reliability: {
      knownIssues: [
        'Occasional maintenance windows during Asian trading hours',
        'Web UI performance degrades with multiple pairs open',
      ],
      lagsDuringVolatility: true,
      heavyBrowserTab: true,
    },
    uniqueArguments: [
      'Bybit invested heavily in their own charting — but traders who use TradingView\'s tools don\'t need another chart. They need a bridge from their chart to the exchange.',
      'Testudo is that bridge. Your TradingView analysis, executed on Bybit, sized by your risk rules.',
      'Every Bybit trade through Testudo is automatically journaled with full analytics — no CSV export and spreadsheet required.',
    ],
    ctaText: 'CONNECT BYBIT TO YOUR CHARTS',
  },
  {
    slug: 'woo-web',
    exchange: 'WOO X',
    type: 'cex',
    webUrl: 'https://x.woo.org',
    title: 'Testudo vs WOO X Web — Zero-Fee Futures With Proper Sizing',
    metaDescription: 'WOO X offers zero-fee futures. Testudo adds risk-managed position sizing and automated journaling on top. Compare the workflows.',
    headline: 'WOO X WEB UI VS. LOCAL CLIENT',
    subheadline: 'Zero fees are great. Blowing up your account is not.',
    speed: {
      exchangeSteps: 7,
      exchangeSeconds: 15,
      exchangePainPoints: [
        'Clean UI but no TradingView integration',
        'Manual position size calculation',
        'Separate SL/TP order placement',
        'No risk-per-trade controls',
      ],
      testudoSeconds: 0.8,
    },
    sizing: {
      hasCalculator: false,
      factorsStopDistance: false,
      enforcesRiskPercent: false,
      bracketOrders: false,
      limitations: [
        'No position calculator',
        'No stop-distance-based sizing',
        'Reduce-only constraints on some order types',
        'TP orders cannot be reduce-only before position exists',
      ],
    },
    journal: {
      hasExport: true,
      exportFormat: 'CSV',
      rMultiples: false,
      equityCurve: false,
      expectancy: false,
    },
    reliability: {
      knownIssues: [
        'Lower liquidity than Binance/Bybit on some pairs',
        'Occasional WebSocket disconnects',
      ],
      lagsDuringVolatility: false,
      heavyBrowserTab: false,
    },
    uniqueArguments: [
      'WOO X\'s zero-fee structure means sizing errors cost you in bad fills and slippage, not commissions. Proper sizing matters even more when fees aren\'t the bottleneck.',
      'Testudo was originally built and battle-tested on WOO X. The integration is mature and handles WOO-specific quirks (reduce-only constraints, null response fields).',
      'Combine WOO\'s zero fees with Testudo\'s risk management and you have the lowest-cost, most disciplined futures execution stack available.',
    ],
    ctaText: 'TRADE WOO X WITH DISCIPLINE',
  },
  {
    slug: 'okx-web',
    exchange: 'OKX',
    type: 'cex',
    webUrl: 'https://www.okx.com/trade-futures',
    title: 'Testudo vs OKX Web — Risk Management OKX Doesn\'t Offer',
    metaDescription: 'OKX futures trading web interface vs Testudo\'s local execution client. Position sizing, bracket orders, and trade journaling compared.',
    headline: 'OKX WEB UI VS. LOCAL CLIENT',
    subheadline: 'OKX has features. Testudo has discipline.',
    speed: {
      exchangeSteps: 8,
      exchangeSeconds: 18,
      exchangePainPoints: [
        'Feature-rich UI with steep learning curve',
        'Switch from TradingView to OKX tab',
        'Navigate between spot, margin, futures, options UIs',
        'Manual size entry with no risk calculation',
        'SL/TP as post-entry modifications',
      ],
      testudoSeconds: 0.8,
    },
    sizing: {
      hasCalculator: true,
      factorsStopDistance: false,
      enforcesRiskPercent: false,
      bracketOrders: false,
      limitations: [
        'Calculator exists but margin-based, not risk-based',
        'No stop-distance-aware sizing',
        'No account risk percentage enforcement',
        'API requires additional passphrase (3-credential auth)',
      ],
    },
    journal: {
      hasExport: true,
      exportFormat: 'CSV',
      rMultiples: false,
      equityCurve: false,
      expectancy: false,
    },
    reliability: {
      knownIssues: [
        'Complex UI can overwhelm during fast markets',
        'Multiple product types (spot/margin/futures/options) add navigation friction',
      ],
      lagsDuringVolatility: true,
      heavyBrowserTab: true,
    },
    uniqueArguments: [
      'OKX is a Swiss Army knife — spot, margin, futures, options, earn, DEX, NFTs. Testudo is a scalpel — one thing, done perfectly: risk-managed futures execution from TradingView.',
      'OKX\'s complexity means more clicks, more tabs, more chances to mis-size. Testudo collapses the entire workflow to Alt+X.',
    ],
    ctaText: 'SIMPLIFY YOUR OKX TRADING',
  },
]
