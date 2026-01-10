import { Card } from '../ui/Card'

export function Pricing() {
  const tiers = [
    {
      name: "FREE",
      price: "$0",
      period: "",
      features: ["2 exchanges", "Manual sizing", "Limited volume"],
      cta: "GET STARTED",
      highlight: false,
    },
    {
      name: "PRO",
      price: "$49",
      period: "/mo",
      features: ["Unlimited exchanges", "Full risk engine", "Smart routing"],
      cta: "JOIN WAITLIST",
      highlight: true,
    },
    {
      name: "ELITE",
      price: "$149",
      period: "/mo",
      features: ["Everything in Pro", "API access", "Custom risk rules"],
      cta: "CONTACT US",
      highlight: false,
    },
  ]

  return (
    <section id="pricing" className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-5xl">
        <Card>
          <p className="font-mono text-signal-green text-sm tracking-widest mb-4">
            PRICING
          </p>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-3">
            SUBSCRIPTION ONLY
          </h2>

          <p className="font-mono text-text-secondary mb-10">
            No volume fees. No hidden cuts. Ever.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`p-5 border bg-container-bg ${
                  tier.highlight
                    ? 'border-signal-green'
                    : 'border-container-border'
                }`}
              >
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">
                  {tier.name}
                </h3>

                <div className="mb-5">
                  <span className="font-display text-3xl font-black text-text-primary">
                    {tier.price}
                  </span>
                  <span className="font-mono text-text-secondary text-sm">
                    {tier.period}
                  </span>
                </div>

                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="font-mono text-sm text-text-secondary">
                      <span className="text-signal-green mr-2">→</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 font-mono font-bold text-sm transition-colors ${
                    tier.highlight
                      ? 'bg-signal-green text-main-bg hover:bg-white'
                      : 'border border-container-border text-text-primary hover:border-signal-green'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
