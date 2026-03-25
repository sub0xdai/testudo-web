import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { useAuth } from '../../context/AuthContext'
import { useTheme, THEME_LABELS } from '../../context/ThemeContext'

const LazyConnectButton = lazy(() =>
  import('@rainbow-me/rainbowkit').then(m => ({ default: m.ConnectButton }))
)

function AccountChip() {
  const { user, logout } = useAuth()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const addr = user?.wallet_address ?? address ?? ''
  if (!addr) return null
  const truncated = `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-1.5 border border-container-border text-text-primary font-mono text-xs tracking-wider hover:border-text-primary transition-colors"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-signal-green animate-pulse" />
        {truncated}
        <svg width="10" height="10" viewBox="0 0 10 10" className={`text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-container-bg border border-container-border z-50 flex flex-col">
          <button
            onClick={() => { navigate('/account'); setOpen(false) }}
            className="text-left px-4 py-2.5 text-xs font-mono text-text-secondary hover:bg-main-bg hover:text-text-primary transition-colors"
          >
            ACCOUNT
          </button>
          <button
            onClick={() => { logout(); disconnect(); setOpen(false) }}
            className="text-left px-4 py-2.5 text-xs font-mono text-signal-red hover:bg-signal-red/10 transition-colors border-t border-container-border"
          >
            DISCONNECT
          </button>
        </div>
      )}
    </div>
  )
}

export function Header() {
  const { isAuthenticated } = useAuth()
  const { isConnected } = useAccount()
  const { theme, cycleTheme } = useTheme()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-4 bg-main-bg/90 border-b border-container-border/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-mono text-lg tracking-widest text-text-primary hover:text-accent-steel transition-colors">
            TESTUDO
          </Link>
          <button
            onClick={cycleTheme}
            className="text-text-secondary hover:text-text-primary transition-colors"
            title={`Theme: ${THEME_LABELS[theme]} (click to toggle)`}
            aria-label="Toggle theme"
          >
            {theme === 'amoled' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex items-center gap-6 md:gap-8">
          <Link to="/about" className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block">ABOUT</Link>
          <a href="#pricing" className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block">PRICING</a>
          <a href="/desk/" target="_blank" rel="noopener noreferrer" className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block">DESK</a>
          <a href="/docs/" target="_blank" rel="noopener noreferrer" className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block">DOCS</a>
          <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer" className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block">EXTENSION</a>

          {isAuthenticated || isConnected ? (
            <AccountChip />
          ) : (
            <Suspense fallback={<span className="font-mono text-xs tracking-wider text-text-secondary">CONNECT</span>}>
              <div className="rk-header-btn">
                <LazyConnectButton label="CONNECT" showBalance={false} chainStatus="none" accountStatus="address" />
              </div>
            </Suspense>
          )}
        </nav>
      </div>
    </header>
  )
}
