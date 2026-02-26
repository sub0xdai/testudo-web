import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/account" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) {
      setError('Invalid email format')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await register(email, password)
      navigate('/account')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setError(axiosErr.response?.data?.error || 'Registration failed')
      } else {
        setError('Connection failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-8">
          CREATE ACCOUNT
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-mono text-sm text-text-secondary mb-2">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-main-bg border border-container-border font-mono text-text-primary placeholder-text-tertiary focus:border-signal-green focus:outline-none"
              placeholder="YOUR@EMAIL.COM"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-sm text-text-secondary mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-main-bg border border-container-border font-mono text-text-primary placeholder-text-tertiary focus:border-signal-green focus:outline-none"
              placeholder="MIN 8 CHARACTERS"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-sm text-text-secondary mb-2">
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-main-bg border border-container-border font-mono text-text-primary placeholder-text-tertiary focus:border-signal-green focus:outline-none"
              placeholder="REPEAT PASSWORD"
              required
            />
          </div>

          {error && (
            <p className="font-mono text-sm text-signal-red">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-8 py-4 bg-signal-green text-main-bg font-mono font-bold text-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            {submitting ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="mt-6 font-mono text-sm text-text-secondary text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-signal-green hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
