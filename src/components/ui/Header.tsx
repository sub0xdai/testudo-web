import { Link } from 'react-router-dom'
import { useTheme, THEME_LABELS } from '../../context/ThemeContext'

export function Header() {
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
          <a href="/docs/" target="_blank" rel="noopener noreferrer" className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block">DOCS</a>
          <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer" className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block">EXTENSION</a>
          <a href="/desk/" className="font-mono text-xs tracking-wider text-text-primary hover:text-accent-steel transition-colors">LAUNCH DESK</a>
        </nav>
      </div>
    </header>
  )
}
