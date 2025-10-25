import React from 'react'

interface ASCIIBoxProps {
  title?: string
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
  scrollable?: boolean
}

export const ASCIIBox: React.FC<ASCIIBoxProps> = ({
  title,
  children,
  variant = 'default',
  className = '',
  scrollable = false,
}) => {
  const variantClasses = {
    default: 'border-terminal-border',
    success: 'border-terminal-fg',
    warning: 'border-terminal-warning',
    error: 'border-terminal-error',
  }

  return (
    <div
      className={`border ${variantClasses[variant]} bg-terminal-highlight ${className}`}
      style={scrollable ? { display: 'flex', flexDirection: 'column', height: '100%' } : undefined}
    >
      {title && (
        <div
          className="border-b border-current px-3 py-2 font-bold text-terminal-fg"
          style={scrollable ? { flexShrink: 0 } : undefined}
        >
          {title}
        </div>
      )}
      <div
        className="p-3"
        style={scrollable ? { flex: 1, overflowY: 'auto', minHeight: 0 } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
