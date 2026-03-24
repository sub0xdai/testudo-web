// LoginPage is no longer used — SIWE auth is handled globally in AuthContext.
// The [ CONNECT ] button in the Header opens RainbowKit directly.
// This file is kept as a redirect fallback for any stale /login links.

import { Navigate } from 'react-router-dom'

export function LoginPage() {
  return <Navigate to="/" replace />
}
