import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'

export function JournalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-md w-full text-center">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-4">
          JOURNAL
        </h1>
        <p className="font-mono text-text-secondary mb-8">
          Coming soon — trade history, P&L analytics, and performance insights.
        </p>
        <Link
          to="/"
          className="font-mono text-text-primary underline hover:text-text-secondary transition-colors"
        >
          &larr; BACK TO HOME
        </Link>
      </Card>
    </div>
  )
}
