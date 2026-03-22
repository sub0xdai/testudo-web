export function Features() {
  const primary = {
    label: 'RISK ENGINE',
    detail: 'Automated position sizing. Every trade. Never overexposed.',
  }

  const secondary = [
    {
      label: 'DEX + CEX',
      detail:
        'Command from a single banner. Hyperliquid, Binance, Bybit, WOO. One risk layer across all your accounts.',
    },
    {
      label: 'CIRCUIT BREAKERS',
      detail:
        'Daily loss limits. Portfolio heat tracking. The system protects you from yourself.',
    },
    {
      label: 'BROWSER EXTENSION',
      detail:
        'Strike direct. Execute from TradingView with Alt+X. Seamless execution. No hesitation.',
    },
  ]

  return (
    <section
      id="features"
      className="relative z-10 px-6 md:px-12 lg:px-24 py-24"
    >
      <div className="max-w-5xl">
        <div className="font-mono text-xs tracking-widest text-text-secondary/70 animate-flicker mb-6">
          // SYSTEM_CAPABILITIES
        </div>

        <h2 className="font-mono text-2xl md:text-3xl font-bold text-text-primary mb-12">
          CORE [SYSTEMS]
        </h2>

        {/* Primary feature — full-width, visually dominant */}
        <div className="border border-text-primary p-6 md:p-8 mb-8">
          <div className="font-mono text-[10px] text-text-tertiary mb-4">
            // core_module &mdash; position_sizer.rs
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-3">
            {primary.label}
          </h3>
          <p className="font-mono text-sm text-text-secondary max-w-xl leading-relaxed">
            {primary.detail}
          </p>
        </div>

        {/* Secondary features — compact border-left markers */}
        <div className="grid md:grid-cols-3 gap-4">
          {secondary.map((feature) => (
            <div
              key={feature.label}
              className="border-l border-container-border pl-4 py-2"
            >
              <h4 className="font-mono text-xs tracking-widest text-text-secondary mb-1">
                {feature.label}
              </h4>
              <p className="font-mono text-sm text-text-tertiary leading-relaxed">
                {feature.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
