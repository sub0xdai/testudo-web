import { useState, useEffect, useRef, useCallback } from 'react'
import { authApi } from '../api/client'

const CODE_TTL_SECONDS = 300

export function ExtensionPairingBanner() {
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
    <div className="mt-8 border-t border-container-border pt-6">
      {code ? (
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <h3 className="font-display text-sm font-bold text-text-primary whitespace-nowrap">
              EXTENSION PAIRING
            </h3>
            <span className="font-mono text-2xl font-bold text-text-primary tracking-[0.3em]">
              {code}
            </span>
            <span className="font-mono text-xs text-text-tertiary">
              {minutes}:{seconds}
            </span>
          </div>
          <button
            onClick={generateCode}
            disabled={generating}
            className="px-4 py-2 font-mono text-xs text-text-secondary border border-container-border hover:text-text-primary hover:border-text-primary transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {generating ? 'GENERATING...' : 'NEW CODE'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-display text-sm font-bold text-text-primary">
              EXTENSION PAIRING
            </h3>
            <p className="font-mono text-xs text-text-tertiary mt-0.5">
              Generate a code to link the Testudo browser extension.
            </p>
          </div>
          <button
            onClick={generateCode}
            disabled={generating}
            className="px-4 py-2 font-mono text-xs font-bold text-text-primary border border-container-border hover:bg-text-primary hover:text-main-bg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {generating ? 'GENERATING...' : 'PAIR EXTENSION'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 px-4 py-2 border border-signal-red bg-signal-red/10 font-mono text-xs text-signal-red">
          {error}
        </div>
      )}
    </div>
  )
}
