import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 py-32">
      {/* Ghost metadata */}
      <div className="font-mono text-xs tracking-widest text-text-secondary/70 animate-flicker mb-8">
        // RISK_OVERLAY_ACTIVE &bull; POSITION_SIZING: ADAPTIVE &bull; EXCHANGES: MULTI
      </div>

      <div className="max-w-5xl">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text-primary leading-[0.95] mb-8">
          AUTOMATED
          <br />
          RISK [MANAGEMENT]
        </h1>

        <p className="font-mono text-base md:text-lg text-text-secondary max-w-xl mb-12 leading-relaxed">
          Position sizing that adapts to volatility.
          <br />
          Engineered for traders who don't blow up.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            to="/register"
            className="px-6 py-3 border border-text-primary text-text-primary font-mono text-sm tracking-wider hover:bg-text-primary hover:text-main-bg transition-colors text-center"
          >
            GET STARTED
          </Link>
          <a
            href="https://github.com/sub0xdai/testudo-exchange"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-container-border text-text-secondary font-mono text-sm tracking-wider hover:border-text-primary hover:text-text-primary transition-colors text-center"
          >
            VIEW SOURCE &gt;&gt;
          </a>
        </div>
      </div>

      {/* Data ticker — bottom right (green/red kept for financial data only) */}
      <div className="absolute bottom-12 right-6 md:right-12 lg:right-24 font-mono text-xs animate-ticker-pulse">
        <div className="border border-container-border/50 bg-main-bg/60 backdrop-blur-sm p-4 space-y-2">
          <div className="flex items-center justify-between gap-6">
            <span className="text-text-tertiary">BTC</span>
            <span className="text-text-primary">$98,240</span>
            <span className="text-signal-green text-[10px]">+1.2%</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-text-tertiary">ETH</span>
            <span className="text-text-primary">$3,412</span>
            <span className="text-signal-red text-[10px]">-2.3%</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-text-tertiary">SOL</span>
            <span className="text-text-primary">$187</span>
            <span className="text-signal-green text-[10px]">+0.8%</span>
          </div>
        </div>
      </div>

      {/* Ghost annotation — bottom left */}
      <div className="absolute bottom-12 left-6 md:left-12 lg:left-24 font-mono text-[10px] text-text-tertiary animate-flicker">
        // TESTUDO v0.1 &bull; FUTURES_OVERLAY
      </div>
    </section>
  )
}
