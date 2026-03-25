import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Header } from './components/ui/Header'
import { LandingPage } from './pages/LandingPage'
import { AboutPage } from './pages/AboutPage'
import { ProtectedRoute } from './context/AuthContext'

const AccountPage = lazy(() =>
  import('./pages/AccountPage').then(m => ({ default: m.AccountPage }))
)

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/account" element={
          <ProtectedRoute>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <span className="font-mono text-text-secondary">LOADING...</span>
              </div>
            }>
              <AccountPage />
            </Suspense>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}

export default App
