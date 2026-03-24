import { useState, useEffect, useRef, useCallback } from 'react'
import { authApi } from '../api/client'

const CODE_TTL_SECONDS = 300 // 5 minutes

export function ExtensionPairing() {
  const [code, setCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  const generateCode = async () => {
    setGenerating(true)
    setError('')
    try {
      const { code: newCode } = await authApi.pairExtension()
      setCode(newCode)
      setCountdown(CODE_TTL_SECONDS)

      clearTimer()
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearTimer()
            setCode(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setError('Failed to generate pairing code')
    } finally {
      setGenerating(false)
    }
  }

  const minutes = Math.floor(countdown / 60)
  const seconds = String(countdown % 60).padStart(2, '0')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold text-text-primary">
          EXTENSION PAIRING
        </h3>
        <p className="font-mono text-sm text-text-secondary mt-1">
          Generate a code, then enter it in the Testudo extension popup to link your browser session.
        </p>
      </div>

      {code ? (
        <div className="space-y-3">
          <div className="py-4 text-center border border-container-border bg-main-bg">
            <p className="font-mono text-4xl font-bold text-text-primary tracking-[0.3em]">
              {code}
            </p>
          </div>
          <p className="font-mono text-xs text-text-tertiary text-center">
            Expires in {minutes}:{seconds}
          </p>
          <button
            onClick={generateCode}
            disabled={generating}
            className="w-full px-4 py-2 font-mono text-sm text-text-secondary border border-container-border hover:text-text-primary hover:border-text-primary transition-colors disabled:opacity-50"
          >
            {generating ? 'GENERATING...' : 'NEW CODE'}
          </button>
        </div>
      ) : (
        <button
          onClick={generateCode}
          disabled={generating}
          className="w-full px-4 py-3 font-mono font-bold text-sm text-text-primary border border-container-border hover:bg-text-primary hover:text-main-bg transition-colors disabled:opacity-50"
        >
          {generating ? 'GENERATING...' : 'PAIR EXTENSION'}
        </button>
      )}

      {error && (
        <div className="px-4 py-3 border border-signal-red bg-signal-red/10 font-mono text-sm text-signal-red">
          {error}
        </div>
      )}
    </div>
  )
}
