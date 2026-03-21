import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import { RegisterFormSchema } from '../validation/forms'

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const inputClass = 'w-full px-4 py-3 bg-container-bg border border-container-border text-text-primary placeholder-text-tertiary focus:border-text-secondary focus:outline-none focus:ring-[3px] focus:ring-text-primary/10 transition-all'

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/account" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validation = RegisterFormSchema.safeParse({
      email: email.trim(),
      password,
      confirmPassword,
    })
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid registration fields')
      return
    }

    setSubmitting(true)
    try {
      await register(validation.data.email, validation.data.password)
      navigate('/account', { state: { freshRegistration: true } })
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
      <Card className="max-w-md w-full" rounded>
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-wider mb-8">
          CREATE ACCOUNT
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold tracking-widest text-text-secondary mb-2">
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

          <div>
            <label className="block text-xs font-semibold tracking-widest text-text-secondary mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="Min 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-text-secondary hover:text-text-primary bg-transparent border-0 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-widest text-text-secondary mb-2">
              CONFIRM PASSWORD
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="Repeat password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-text-secondary hover:text-text-primary bg-transparent border-0 transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-signal-red py-2.5 px-3.5 border border-signal-red/20 bg-signal-red/5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-transparent btn-primary font-bold text-sm tracking-[0.2em] disabled:opacity-50"
          >
            {submitting ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="mt-6 text-sm text-text-secondary text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-text-primary underline hover:text-text-secondary transition-colors">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
