import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { authApi } from '../api/client'
import { z } from 'zod'

const EmailSchema = z.string().email('Invalid email format')

const inputClass = 'w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-md text-text-primary placeholder-text-tertiary focus:border-signal-green focus:outline-none focus:ring-[3px] focus:ring-signal-green/15 transition-all'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validation = EmailSchema.safeParse(email.trim())
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid email')
      return
    }

    setSubmitting(true)
    try {
      await authApi.forgotPassword(validation.data)
      setSent(true)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setError(axiosErr.response?.data?.error || 'Request failed')
      } else {
        setError('Connection failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="max-w-md w-full" rounded>
          <h1 className="font-display text-3xl font-bold text-text-primary tracking-wider mb-4">
            CHECK YOUR EMAIL
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            If an account exists for <span className="text-signal-green font-mono">{email}</span>, you'll receive a password reset link shortly.
          </p>
          <Link
            to="/login"
            className="block w-full py-3.5 bg-signal-green text-main-bg font-bold text-sm tracking-[0.2em] rounded-md hover:bg-white transition-colors text-center"
          >
            BACK TO LOGIN
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-md w-full" rounded>
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-wider mb-4">
          RESET PASSWORD
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold tracking-widest text-gray-400 mb-2">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="your@email.com"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 py-2.5 px-3.5 border border-red-500/20 bg-red-500/5 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-signal-green text-main-bg font-bold text-sm tracking-[0.2em] rounded-md hover:bg-white transition-colors disabled:opacity-50"
          >
            {submitting ? 'SENDING...' : 'SEND RESET LINK'}
          </button>
        </form>

        <p className="mt-6 text-sm text-text-secondary text-center">
          Remember your password?{' '}
          <Link to="/login" className="text-signal-green hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
