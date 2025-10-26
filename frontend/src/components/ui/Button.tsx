import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  // Map legacy variants for backward compatibility
  const normalizedVariant = variant === 'error' ? 'danger' : variant === 'default' ? 'primary' : variant

  const variantStyles = {
    primary: {
      borderColor: '#4da6ff',
      color: '#4da6ff',
      hoverBg: '#4da6ff',
      hoverColor: '#0a0e14',
    },
    secondary: {
      borderColor: 'rgba(77, 166, 255, 0.3)',
      color: '#4da6ff',
      hoverBg: 'rgba(77, 166, 255, 0.1)',
      hoverColor: '#4da6ff',
    },
    accent: {
      borderColor: '#00d4ff',
      color: '#00d4ff',
      hoverBg: '#00d4ff',
      hoverColor: '#0a0e14',
    },
    danger: {
      borderColor: '#ff4444',
      color: '#ff4444',
      hoverBg: '#ff4444',
      hoverColor: '#0a0e14',
    },
    ghost: {
      borderColor: 'transparent',
      color: '#4da6ff',
      hoverBg: 'rgba(77, 166, 255, 0.1)',
      hoverColor: '#4da6ff',
    },
    success: {
      borderColor: '#00ff00',
      color: '#00ff00',
      hoverBg: '#00ff00',
      hoverColor: '#0a0e14',
    },
    warning: {
      borderColor: '#ffaa00',
      color: '#ffaa00',
      hoverBg: '#ffaa00',
      hoverColor: '#0a0e14',
    },
  }

  const sizeStyles = {
    sm: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.75rem',
    },
    md: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
    },
  }

  const currentVariant = variantStyles[normalizedVariant as keyof typeof variantStyles]
  const currentSize = sizeStyles[size]

  const baseStyle = {
    ...currentSize,
    border: '2px solid',
    borderColor: currentVariant.borderColor,
    backgroundColor: 'transparent',
    color: currentVariant.color,
    fontFamily: 'JetBrains Mono, monospace',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  }

  return (
    <button
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = currentVariant.hoverBg
          e.currentTarget.style.color = currentVariant.hoverColor
          if (normalizedVariant === 'secondary' || normalizedVariant === 'ghost') {
            e.currentTarget.style.borderColor = '#4da6ff'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = currentVariant.color
          e.currentTarget.style.borderColor = currentVariant.borderColor
        }
      }}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
