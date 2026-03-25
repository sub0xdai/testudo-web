import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { authApi } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  siweError: string | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [siweError, setSiweError] = useState<string | null>(null)
  const siweInFlight = useRef(false)
  // Track if the wallet was disconnected before connecting — distinguishes
  // "user clicked Connect" from "wagmi auto-reconnected stale session on page load"
  const wasDisconnected = useRef(false)

  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()

  // On mount: check existing cookie session
  useEffect(() => {
    authApi.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Track disconnected state so we can distinguish fresh connects from reconnects
  useEffect(() => {
    if (!isConnected) {
      wasDisconnected.current = true
    }
  }, [isConnected])

  // SIWE: only fires when wallet transitions from disconnected → connected
  // (i.e., user clicked Connect), NOT on page-load reconnect
  useEffect(() => {
    if (!isConnected || !address || user || loading) return
    if (!wasDisconnected.current) return // skip stale reconnect
    if (siweInFlight.current) return

    siweInFlight.current = true
    setSiweError(null)

    const runSiwe = async () => {
      try {
        const { nonce } = await authApi.nonce()
        const message = [
          `${window.location.host} wants you to sign in with your Ethereum account:`,
          address, '', 'Sign in to Testudo', '',
          `URI: ${window.location.origin}`,
          `Version: 1`,
          `Chain ID: 42161`,
          `Nonce: ${nonce}`,
          `Issued At: ${new Date().toISOString()}`,
        ].join('\n')

        const signature = await signMessageAsync({ message })
        const { user: u } = await authApi.verifySiwe(message, signature)
        setUser(u)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Authentication failed'
        console.error('[SIWE] auth failed:', msg)
        setSiweError(/reject|denied|cancel/i.test(msg)
          ? 'Signature rejected — click Connect to retry'
          : msg)
        disconnect()
      } finally {
        siweInFlight.current = false
      }
    }

    runSiwe()
  }, [isConnected, address, user, loading, signMessageAsync, disconnect])

  const logout = async () => {
    await authApi.logout().catch(() => {})
    setUser(null)
    disconnect()
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, loading, siweError, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const { isConnected } = useAccount()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-text-secondary">LOADING...</span>
      </div>
    )
  }
  if (!isAuthenticated && !isConnected) return <Navigate to="/" replace />
  return <>{children}</>
}
