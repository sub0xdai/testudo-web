import { Card } from '../ui/Card'

export function Exchanges() {
  const exchanges = [
    "BINANCE",
    "COINBASE",
    "KRAKEN",
    "HYPERLIQUID",
  ]

  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-5xl">
        <Card>
          <p className="font-mono text-text-secondary text-sm tracking-widest mb-6">
            SUPPORTED EXCHANGES
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            {exchanges.map((exchange) => (
              <div
                key={exchange}
                className="px-5 py-3 border border-container-border font-mono text-text-primary hover:border-signal-green transition-colors"
              >
                {exchange}
              </div>
            ))}
            <span className="font-mono text-text-tertiary">+ MORE COMING</span>
          </div>
        </Card>
      </div>
    </section>
  )
}
