import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'

export function Pricing() {
  const tiers = [
    {
      name: "PAPER",
      price: "FREE",
      subtitle: "",
      features: [
        "Shadow trading engine",
        "Full risk engine",
        "Position sizing",
        "No API keys needed"
      ],
      highlight: false,
    },
    {
      name: "LIVE",
      price: "FREE",
      subtitle: "while in beta",
      features: [
        "Everything in Paper",
        "Live exchange execution",
        "Multi-exchange support",
        "Real-time WebSocket data",
        "Trade journal"
      ],
      highlight: true,
    },
  ]

  return (
    <section id="pricing" className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-4xl">
        <Card>
          <p className="font-mono text-signal-green text-sm tracking-widest mb-4">
            PRICING
          </p>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-3">
            FREE WHILE IN BETA.
          </h2>

          <p className="font-mono text-text-secondary mb-10">
            No subscriptions. No token gates. Just trade.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`p-6 border bg-container-bg rounded-md ${
                  tier.highlight
                    ? 'border-signal-green'
                    : 'border-container-border'
                }`}
              >
                <h3 className="font-display text-lg font-bold text-text-primary mb-1">
                  {tier.name}
                </h3>

                <div className="mb-5">
                  <span className="font-display text-4xl font-black text-text-primary">
                    {tier.price}
                  </span>
                  {tier.subtitle && (
                    <span className="font-mono text-text-secondary text-sm ml-2">
                      {tier.subtitle}
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="font-mono text-sm text-text-secondary">
                      <span className="text-signal-green mr-2">&rarr;</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block w-full py-3 font-mono font-bold text-sm rounded-md transition-colors text-center ${
                    tier.highlight
                      ? 'bg-signal-green text-main-bg hover:bg-white'
                      : 'border border-container-border text-text-primary hover:border-signal-green'
                  }`}
                >
                  GET STARTED
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
