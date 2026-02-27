import { Card } from '../ui/Card'

export function RiskEngine() {
  const features = [
    {
      label: "VOLATILITY-ADJUSTED SIZING",
      detail: "High volatility = smaller position. Automatically.",
    },
    {
      label: "PORTFOLIO HEAT TRACKING",
      detail: "Total exposure across all venues. Always visible.",
    },
    {
      label: "MAX RISK ENFORCEMENT",
      detail: "Set 1% risk per trade. System makes it impossible to exceed.",
    },
    {
      label: "CIRCUIT BREAKERS",
      detail: "Daily loss limit hits. Trading locks. Go outside.",
    },
  ]

  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-5xl">
        <Card>
          <p className="font-mono text-signal-green text-sm tracking-widest mb-4">
            THE DIFFERENTIATOR
          </p>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
            AUTOMATED RISK ENGINE
          </h2>

          <p className="font-mono text-xl text-text-secondary mb-10 max-w-2xl">
            Most traders lose because of sizing, not entries.
            <span className="text-signal-green"> We fix that.</span>
          </p>

          <div className="space-y-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-5 border border-container-border bg-container-bg rounded-md flex flex-col md:flex-row md:items-center gap-3"
              >
                <span className="font-mono text-signal-green text-sm w-56 shrink-0">
                  {feature.label}
                </span>
                <span className="font-mono text-text-secondary text-sm">
                  {feature.detail}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
