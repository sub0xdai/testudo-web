import { Card } from '../ui/Card'

export function FinalCTA() {
  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-3xl">
        <Card>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
            STOP JUGGLING EXCHANGES
          </h2>

          <p className="font-mono text-xl text-text-secondary mb-8">
            One interface. Automated risk. No more blowing up.
          </p>

          <form className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="YOUR@EMAIL.COM"
              className="flex-1 px-4 py-4 bg-container-bg border border-container-border font-mono text-text-primary placeholder:text-text-tertiary focus:border-signal-green focus:outline-none"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-signal-green text-main-bg font-mono font-bold hover:bg-white transition-colors shrink-0"
            >
              JOIN WAITLIST
            </button>
          </form>
        </Card>
      </div>
    </section>
  )
}
