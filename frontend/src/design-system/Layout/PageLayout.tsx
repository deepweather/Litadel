import React from 'react'

interface PageLayoutProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-full',
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  maxWidth = 'full',
  className = '',
}) => {
  const classes = `flex flex-col gap-lg h-full ${maxWidthClasses[maxWidth]} ${className}`.trim()

  return (
    <div className={classes}>
      {children}
    </div>
  )
}

