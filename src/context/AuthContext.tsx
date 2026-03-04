import { createContext, useContext, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { authApi } from '../api/client'

interface User {
  id: string
  email: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function decodeJwtPayload(token: string): { sub?: string; email?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      const payload = decodeJwtPayload(token)
      if (payload?.sub && payload?.email) {
        return { id: payload.sub, email: payload.email }
      }
    }
    return null
  })
  const [loading] = useState(false)

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('access_token', data.tokens.access_token)
    localStorage.setItem('refresh_token', data.tokens.refresh_token)
    setUser(data.user)
  }

  const register = async (email: string, password: string) => {
    const data = await authApi.register(email, password)
    localStorage.setItem('access_token', data.tokens.access_token)
    localStorage.setItem('refresh_token', data.tokens.refresh_token)
    setUser(data.user)
  }

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {})
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-text-secondary">LOADING...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
