import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/client'

type SiweState = 'idle' | 'signing' | 'verifying' | 'error'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()
  const [siweState, setSiweState] = useState<SiweState>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSiwe = useCallback(async (addr: string) => {
    setError(null)
    setSiweState('signing')

    try {
      // 1. Fetch nonce from backend
      const { nonce } = await authApi.nonce()

      // 2. Construct EIP-4361 (SIWE) message
      const message = [
        `${window.location.host} wants you to sign in with your Ethereum account:`,
        addr,
        '',
        'Sign in to Testudo',
        '',
        `URI: ${window.location.origin}`,
        `Version: 1`,
        `Chain ID: 42161`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join('\n')

      // 3. Request wallet signature
      const signature = await signMessageAsync({ message })

      // 4. Verify with backend — cookie set automatically from Set-Cookie response
      setSiweState('verifying')
      const { user } = await authApi.verifySiwe(message, signature)

      // 5. Update auth state
      login(user)
    } catch (err) {
      setSiweState('error')

      // User rejected the signature request
      if (err instanceof Error && /reject|denied|cancel/i.test(err.message)) {
        setError('Signature rejected — click below to try again')
        disconnect()
        return
      }

      // Backend or network error
      setError(err instanceof Error ? err.message : 'Authentication failed')
      disconnect()
    }
  }, [signMessageAsync, disconnect, login])

  // Auto-trigger SIWE after wallet connects
  useEffect(() => {
    if (isConnected && address && siweState === 'idle') {
      handleSiwe(address)
    }
  }, [isConnected, address, siweState, handleSiwe])

  if (isAuthenticated) {
    return <Navigate to="/account" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-wider">
          CONNECT WALLET
        </h1>

        {siweState === 'idle' && (
          <p className="font-mono text-sm text-text-secondary">
            Sign in with your Ethereum wallet to continue
          </p>
        )}

        {siweState === 'signing' && (
          <p className="font-mono text-sm text-text-secondary animate-pulse">
            Sign the message in your wallet...
          </p>
        )}

        {siweState === 'verifying' && (
          <p className="font-mono text-sm text-text-secondary animate-pulse">
            Verifying signature...
          </p>
        )}

        {siweState === 'error' && error && (
          <p className="font-mono text-sm text-signal-red">
            {error}
          </p>
        )}

        <div className="flex justify-center">
          <ConnectButton />
        </div>

        {siweState === 'error' && isConnected && address && (
          <button
            onClick={() => {
              setSiweState('idle')
            }}
            className="font-mono text-sm text-text-secondary underline hover:text-text-primary"
          >
            Try signing again
          </button>
        )}
      </div>
    </div>
  )
}
