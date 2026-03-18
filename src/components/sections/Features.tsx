export function Features() {
  const features = [
    {
      label: 'RISK ENGINE',
      detail: 'Automated position sizing enforced on every trade. Risk-per-trade limits so you never oversize.',
    },
    {
      label: 'DEX + CEX',
      detail: 'Hyperliquid, Binance, Bybit, WOO. One risk layer across all your accounts.',
    },
    {
      label: 'CIRCUIT BREAKERS',
      detail: 'Daily loss limits. Portfolio heat tracking. The system protects you from yourself.',
    },
    {
      label: 'BROWSER EXTENSION',
      detail: 'Execute from TradingView with Alt+X. Shadow DOM overlay. Real-time WebSocket fills.',
    },
    {
      label: 'AGENT WALLETS',
      detail: 'EIP-712 signed approvals for Hyperliquid. Revoke anytime. Your keys, your control.',
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
            <div key={feature.label} className="border-l border-container-border pl-4">
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
