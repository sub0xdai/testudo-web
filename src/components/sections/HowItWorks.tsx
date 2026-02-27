import { Card } from '../ui/Card'

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "CONNECT",
      description: "Add your exchange API keys. Trade-only permissions — we never touch withdrawals.",
    },
    {
      number: "02",
      title: "CONFIGURE",
      description: "Set your risk rules. Max per trade. Daily limits. The system enforces them.",
    },
    {
      number: "03",
      title: "TRADE",
      description: "Execute from the browser extension or API. We handle sizing and protection.",
    },
  ]

  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-5xl">
        <Card>
          <p className="font-mono text-text-secondary text-sm tracking-widest mb-4">
            HOW IT WORKS
          </p>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-10">
            THREE STEPS
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number}>
                <span className="font-display text-5xl font-black text-signal-green/30">
                  {step.number}
                </span>
                <h3 className="font-display text-xl font-bold text-text-primary mt-4 mb-2">
                  {step.title}
                </h3>
                <p className="font-mono text-text-secondary text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
