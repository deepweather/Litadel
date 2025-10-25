import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'success' | 'warning' | 'error'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: {
      borderColor: '#4da6ff',
      color: '#4da6ff',
    },
    success: {
      borderColor: '#4da6ff',
      color: '#4da6ff',
    },
    warning: {
      borderColor: '#ffaa00',
      color: '#ffaa00',
    },
    error: {
      borderColor: '#ff4444',
      color: '#ff4444',
    },
  }

  const baseStyle = {
    padding: '0.5rem 1rem',
    border: '2px solid',
    backgroundColor: 'transparent',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: 'bold',
    ...variantStyles[variant],
  }

  return (
    <button
      style={baseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = variantStyles[variant].borderColor
        e.currentTarget.style.color = '#0a0e14'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color = variantStyles[variant].color
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}
