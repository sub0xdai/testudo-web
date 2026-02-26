import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'

export function Pricing() {
  const tiers = [
    {
      name: "BASIC",
      price: "0.1%",
      subtitle: "per trade",
      features: [
        "Multi-exchange trading",
        "Basic order types",
        "Real-time data",
        "No holding required"
      ],
      highlight: false,
    },
    {
      name: "HOLDER",
      price: "0.05%",
      subtitle: "per trade",
      requirement: "Hold 0.1% $TESTUDO",
      features: [
        "Everything in Basic",
        "Full risk engine",
        "Volatility-based sizing",
        "Smart order routing",
        "50% fee discount"
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
            HOLD $TESTUDO. PAY LESS.
          </h2>

          <p className="font-mono text-text-secondary mb-10">
            No subscriptions. Just hold the bag and trade for less.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`p-6 border bg-container-bg ${
                  tier.highlight
                    ? 'border-signal-green'
                    : 'border-container-border'
                }`}
              >
                <h3 className="font-display text-lg font-bold text-text-primary mb-1">
                  {tier.name}
                </h3>

                {'requirement' in tier && (
                  <p className="font-mono text-xs text-signal-green mb-3">
                    {tier.requirement}
                  </p>
                )}

                <div className="mb-5">
                  <span className="font-display text-4xl font-black text-text-primary">
                    {tier.price}
                  </span>
                  <span className="font-mono text-text-secondary text-sm ml-2">
                    {tier.subtitle}
                  </span>
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
                  className={`block w-full py-3 font-mono font-bold text-sm transition-colors text-center ${
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
