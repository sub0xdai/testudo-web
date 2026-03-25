import { Routes, Route } from 'react-router-dom'
import { Header } from './components/ui/Header'
import { LandingPage } from './pages/LandingPage'
import { AboutPage } from './pages/AboutPage'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </>
  )
}

export default App
