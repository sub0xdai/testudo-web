import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 py-32">
      {/* Ghost metadata */}
      <div className="font-mono text-text-secondary/70 animate-flicker mb-8" style={{ textShadow: '0 1px 8px rgb(var(--bg-core) / 0.6)' }}>
        <div className="text-[10px] text-text-tertiary tracking-widest mb-1">// TESTUDO v0.1 &bull; FUTURES_OVERLAY</div>
        <div className="text-xs tracking-widest">// RISK_OVERLAY_ACTIVE &bull; POSITION_SIZING: FORGEDDABOUDITT &bull; EXCHANGES: POLYAMOROUS</div>
      </div>

      <div className="max-w-5xl">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text-primary leading-[0.95] mb-8">
          AUTOMATED
          <br />
          RISK [MANAGEMENT]
        </h1>

        <p
          className="font-display text-base md:text-lg text-text-secondary max-w-xl mb-12 leading-relaxed"
          style={{ textShadow: '0 1px 12px rgb(var(--bg-core) / 0.8)' }}
        >
          Adapt to the chaos. Outlast the market.
          <br />
          Trade without breaking.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            to="/register"
            className="px-6 py-3 bg-text-primary text-main-bg font-mono text-sm font-semibold tracking-wider hover:opacity-80 transition-opacity text-center"
          >
            [ GET STARTED ]
          </Link>
        </div>
      </div>

    </section>
  )
}
