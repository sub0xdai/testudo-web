import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function Header() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-4 bg-main-bg/60 backdrop-blur-sm border-b border-container-border/30">
      <div className="flex items-center justify-between">
        <Link to="/" className="font-mono text-lg tracking-widest text-text-primary hover:text-accent-steel transition-colors">
          TESTUDO
        </Link>

        <nav className="flex items-center gap-6 md:gap-8">
          <Link
            to="/about"
            className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block"
          >
            ABOUT
          </Link>
          <a
            href="#pricing"
            className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block"
          >
            PRICING
          </a>
          <a
            href="/desk/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block"
          >
            DESK
          </a>
          <a
            href="/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block"
          >
            DOCS
          </a>
          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs tracking-wider text-text-secondary hover:text-text-primary transition-colors hidden md:block"
          >
            EXTENSION
          </a>
          {isAuthenticated ? (
            <Link
              to="/account"
              className="px-4 py-1.5 border border-text-primary text-text-primary font-mono text-xs tracking-wider hover:bg-text-primary hover:text-main-bg transition-colors"
            >
              [ ACCOUNT ]
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 border border-text-primary text-text-primary font-mono text-xs tracking-wider hover:bg-text-primary hover:text-main-bg transition-colors"
            >
              [ LOGIN ]
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
