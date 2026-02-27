import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'

export function Hero() {
  return (
    <section className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 py-32">
      <div className="max-w-5xl">
        <Card className="max-w-3xl">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-text-primary mb-6">
            TRADE EVERY EXCHANGE
            <br />
            <span className="text-accent-steel">FROM ONE SCREEN</span>
          </h1>

          <p className="font-mono text-lg md:text-xl text-text-secondary max-w-2xl mb-10">
            Multi-exchange aggregator with automated risk management.
            Position sizing that adapts to volatility so you don't blow up.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="px-8 py-4 bg-accent-steel text-main-bg font-mono font-bold text-lg hover:bg-accent-steel-hover transition-colors text-center">
              GET STARTED
            </Link>
            <a href="https://github.com/sub0xdai/testudo-exchange" target="_blank" rel="noopener noreferrer" className="px-8 py-4 border-2 border-container-border text-text-primary font-mono font-bold text-lg hover:border-accent-steel transition-colors text-center">
              VIEW DOCS
            </a>
          </div>
        </Card>
      </div>
    </section>
  )
}
