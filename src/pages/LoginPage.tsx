import { Navigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/account" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-wider">
          CONNECT WALLET
        </h1>
        <p className="font-mono text-sm text-text-secondary">
          Sign in with your Ethereum wallet to continue
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    </div>
  )
}
