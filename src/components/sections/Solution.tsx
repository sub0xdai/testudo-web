import { Card } from '../ui/Card'

export function Solution() {
  const pillars = [
    {
      title: "UNIFIED TRADING",
      description: "One interface, all exchanges. Smart order routing finds the best venue.",
    },
    {
      title: "RISK ENGINE",
      description: "Volatility-adjusted sizing. Portfolio-wide limits. No more 3am mistakes.",
    },
    {
      title: "STAY IN CONTROL",
      description: "Circuit breakers. Daily loss limits. The system protects you from yourself.",
    },
  ]

  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-5xl">
        <Card>
          <p className="font-mono text-signal-green text-sm tracking-widest mb-4">
            THE SOLUTION
          </p>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-10">
            TESTUDO FIXES THIS
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {pillars.map((pillar, i) => (
              <div
                key={i}
                className="p-5 border border-container-border bg-container-bg hover:border-signal-green transition-colors"
              >
                <h3 className="font-display text-lg font-bold text-signal-green mb-3">
                  {pillar.title}
                </h3>
                <p className="font-mono text-text-secondary text-sm">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
