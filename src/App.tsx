import { Routes, Route } from 'react-router-dom'
import { Header } from './components/ui/Header'
import { LandingPage } from './pages/LandingPage'
import { AccountPage } from './pages/AccountPage'
import { AboutPage } from './pages/AboutPage'
import { ProtectedRoute } from './context/AuthContext'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default App
