import { Link } from 'react-router-dom'

export function Pricing() {
  const tiers = [
    {
      name: 'SNIPER',
      price: '$20',
      subtitle: '/mo',
      features: [
        'Risk engine + position sizing',
        'Multi-exchange execution',
        'Browser extension',
        'Real-time WebSocket fills',
      ],
      highlight: false,
    },
    {
      name: 'COMMAND',
      price: '$50',
      subtitle: '/mo',
      features: [
        'Everything in Sniper',
        'Trade journal + analytics',
        'Performance tracking',
        'P&L breakdowns',
      ],
      highlight: false,
    },
    {
      name: 'LIFETIME',
      price: '$50',
      subtitle: 'one-time',
      features: [
        'Everything in Command',
        'One payment, forever',
        'Early adopter pricing',
        'All future updates',
      ],
      highlight: true,
    },
  ]

  return (
    <section id="pricing" className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-4xl">
        <div className="font-mono text-xs tracking-widest text-text-secondary/70 animate-flicker mb-6">
          // PRICING_MODULE
        </div>

        <h2 className="font-mono text-2xl md:text-3xl font-bold text-text-primary mb-2">
          [PRICING]
        </h2>

        <p className="font-display text-sm text-text-secondary mb-12">
          Two tiers. No hidden fees. Cancel anytime.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 border bg-main-bg/95 flex flex-col ${
                tier.highlight
                  ? 'border-text-primary'
                  : 'border-container-border'
              }`}
            >
              <h3 className="font-mono text-sm tracking-wider text-text-primary mb-1">
                {tier.name}
              </h3>

              <div className="mb-5">
                <span className="font-mono text-3xl font-bold text-text-primary">
                  {tier.price}
                </span>
                {tier.subtitle && (
                  <span className="font-mono text-text-tertiary text-xs ml-2">
                    {tier.subtitle}
                  </span>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((feature, i) => (
                  <li key={i} className="font-display text-xs text-text-secondary">
                    <span className="text-text-tertiary mr-2">&rarr;</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to="/account"
                className="block w-full py-2.5 bg-transparent btn-primary font-mono font-bold text-xs tracking-wider text-center mt-auto"
              >
                [ GET STARTED ]
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
