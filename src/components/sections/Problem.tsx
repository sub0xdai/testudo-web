import { Card } from '../ui/Card'

export function Problem() {
  const problems = [
    "5 exchange tabs open at once",
    "No unified view of your positions",
    "Sizing manually = sizing emotionally",
    "One bad trade wipes weeks of gains",
  ]

  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-5xl">
        <Card>
          <p className="font-mono text-signal-red text-sm tracking-widest mb-4">
            THE PROBLEM
          </p>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-10">
            TRADING IS FRAGMENTED
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {problems.map((problem, i) => (
              <div
                key={i}
                className="p-5 border border-container-border bg-container-bg"
              >
                <span className="font-mono text-signal-red mr-4">0{i + 1}</span>
                <span className="font-mono text-text-primary">{problem}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
