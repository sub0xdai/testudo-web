import { Card } from '../ui/Card'
import { useState } from 'react'

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xnjjavqa'

export function FinalCTA() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="waitlist" className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-3xl">
        <Card>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
            STOP JUGGLING EXCHANGES
          </h2>

          <p className="font-mono text-xl text-text-secondary mb-8">
            One interface. Automated risk. No more blowing up.
          </p>

          {status === 'success' ? (
            <div className="px-4 py-4 border border-signal-green bg-signal-green/10 font-mono text-signal-green">
              YOU'RE ON THE LIST. WE'LL BE IN TOUCH.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOUR@EMAIL.COM"
                className="flex-1 px-4 py-4 bg-container-bg border border-container-border font-mono text-text-primary placeholder:text-text-tertiary focus:border-signal-green focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="px-8 py-4 bg-signal-green text-main-bg font-mono font-bold hover:bg-white transition-colors shrink-0 disabled:opacity-50"
              >
                {status === 'submitting' ? 'JOINING...' : 'JOIN WAITLIST'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-4 font-mono text-sm text-signal-red">
              SOMETHING WENT WRONG. TRY AGAIN.
            </p>
          )}
        </Card>
      </div>
    </section>
  )
}
