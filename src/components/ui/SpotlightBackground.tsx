import { useEffect, useState } from 'react'

interface SpotlightBackgroundProps {
  imageSrc: string
  spotlightRadius?: number
}

export function SpotlightBackground({
  imageSrc,
  spotlightRadius = 200,
}: SpotlightBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    const checkTheme = () =>
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light')
    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    if (!isLight) {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY })
      }
      window.addEventListener('mousemove', handleMouseMove)
      return () => {
        observer.disconnect()
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }

    return () => observer.disconnect()
  }, [isLight])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Base background image - always visible */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${imageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Dark mode: spotlight follows mouse. Light mode: flat wash. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isLight
            ? `rgb(var(--bg-core) / 0.80)`
            : `radial-gradient(circle ${spotlightRadius}px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgb(var(--bg-core) / 0.85) 80%, rgb(var(--bg-core) / 0.95) 100%)`,
        }}
      />

      {/* Scan-line overlay - dark mode only */}
      {!isLight && <div className="absolute inset-0 scan-lines" />}
    </div>
  )
}
