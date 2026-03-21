export function Features() {
  const features = [
    {
      label: 'RISK ENGINE',
      detail: 'Automated position sizing. Every trade. Never overexposed.',
    },
    {
      label: 'DEX + CEX',
      detail: 'Command from a single banner. Hyperliquid, Binance, Bybit, WOO. One risk layer across all your accounts.',
    },
    {
      label: 'CIRCUIT BREAKERS',
      detail: 'Daily loss limits. Portfolio heat tracking. The system protects you from yourself.',
    },
    {
      label: 'BROWSER EXTENSION',
      detail: 'Strike direct. Execute from TradingView with Alt+X. Seamless execution. No hesitation.',
    },
    
  ]

  return (
    <section id="features" className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-5xl">
        <div className="font-mono text-xs tracking-widest text-text-secondary/70 animate-flicker mb-6">
          // SYSTEM_CAPABILITIES
        </div>

        <h2 className="font-mono text-2xl md:text-3xl font-bold text-text-primary mb-12">
          CORE [SYSTEMS]
        </h2>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          {features.map((feature) => (
            <div key={feature.label} className="border border-container-border bg-main-bg/90 backdrop-blur-sm p-5">
              <h3 className="font-mono text-sm text-text-primary tracking-wider mb-2">
                {feature.label}
              </h3>
              <p className="font-mono text-sm text-text-secondary leading-relaxed">
                {feature.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
