import { Routes, Route } from 'react-router-dom'
import { Header } from './components/ui/Header'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AccountPage } from './pages/AccountPage'
import { JournalPage } from './pages/JournalPage'
import { ProtectedRoute } from './context/AuthContext'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/journal" element={<JournalPage />} />
      </Routes>
    </>
  )
}

export default App
