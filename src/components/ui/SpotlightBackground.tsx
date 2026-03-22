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

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      observer.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

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

      {/* Spotlight follows mouse in both themes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isLight
            ? `radial-gradient(circle ${spotlightRadius}px at ${mousePos.x}px ${mousePos.y}px, rgb(var(--bg-core) / 0.70) 0%, rgb(var(--bg-core) / 0.85) 80%, rgb(var(--bg-core) / 0.92) 100%)`
            : `radial-gradient(circle ${spotlightRadius}px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgb(var(--bg-core) / 0.85) 80%, rgb(var(--bg-core) / 0.95) 100%)`,
        }}
      />

      {/* Texture overlay - scan lines (dark) or paper grain (light) */}
      <div className={`absolute inset-0 ${isLight ? 'texture-grain' : 'scan-lines'}`} />
    </div>
  )
}
