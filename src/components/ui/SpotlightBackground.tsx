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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
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

      {/* Dark overlay with spotlight hole */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle ${spotlightRadius}px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(5, 5, 5, 0.85) 80%, rgba(5, 5, 5, 0.95) 100%)`,
        }}
      />

      {/* Scan-line overlay */}
      <div className="absolute inset-0 scan-lines" />
    </div>
  )
}
