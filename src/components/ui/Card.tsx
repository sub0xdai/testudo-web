import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  rounded?: boolean
  noPadding?: boolean
}

export function Card({
  children,
  className = '',
  rounded: _rounded = false,
  noPadding = false,
}: CardProps) {
  const baseStyles = 'relative border border-container-border bg-main-bg/95'
  const paddingStyles = noPadding ? '' : 'p-6 md:p-8'

  return (
    <div className={`${baseStyles} ${paddingStyles} ${className}`}>
      {children}
    </div>
  )
}
