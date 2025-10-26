import React from 'react'

interface PanelProps {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  highlighted?: boolean
  className?: string
}

const paddingClasses = {
  none: '',
  sm: 'p-md',
  md: 'p-base',
  lg: 'p-lg',
}

export const Panel: React.FC<PanelProps> = ({
  children,
  padding = 'md',
  border = true,
  highlighted = false,
  className = '',
}) => {
  const baseClasses = [
    border ? 'border border-border' : '',
    paddingClasses[padding],
    highlighted ? 'bg-bg-highlight' : 'bg-transparent',
    'font-mono',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={baseClasses}>
      {children}
    </div>
  )
}

