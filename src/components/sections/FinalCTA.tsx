import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'

export function FinalCTA() {
  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-3xl">
        <Card>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
            READY TO TRADE?
          </h2>

          <p className="font-mono text-xl text-text-secondary mb-8">
            One interface. Automated risk. No more blowing up.
          </p>

          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-accent-steel text-main-bg font-mono font-bold text-lg hover:bg-accent-steel-hover transition-colors"
          >
            CREATE ACCOUNT
          </Link>
        </Card>
      </div>
    </section>
  )
}
