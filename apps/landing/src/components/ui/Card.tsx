import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'solid' | 'glass'
  noPadding?: boolean
}

export function Card({
  children,
  className = '',
  variant = 'solid',
  noPadding = false,
}: CardProps) {
  const baseStyles = 'relative border border-container-border'

  const variantStyles = {
    solid: 'bg-main-bg/95',
    glass: 'bg-main-bg/80 backdrop-blur-md',
  }

  const paddingStyles = noPadding ? '' : 'p-6 md:p-8'

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles} ${className}`}>
      {children}
    </div>
  )
}
