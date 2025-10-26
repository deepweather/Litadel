import React from 'react'

interface IconButtonProps {
  icon: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  title?: string
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  variant = 'primary',
  size = 'md',
  title,
  disabled = false,
  className = '',
  style = {},
}) => {
  const variantStyles = {
    primary: {
      border: '1px solid #4da6ff',
      color: '#4da6ff',
      hoverBg: 'rgba(77, 166, 255, 0.1)',
    },
    danger: {
      border: '1px solid #ff0000',
      color: '#ff0000',
      hoverBg: 'rgba(255, 0, 0, 0.1)',
    },
    secondary: {
      border: '1px solid rgba(77, 166, 255, 0.3)',
      color: '#4da6ff',
      hoverBg: 'rgba(77, 166, 255, 0.1)',
    },
    ghost: {
      border: 'none',
      color: '#4da6ff',
      hoverBg: 'rgba(77, 166, 255, 0.1)',
    },
  }

  const sizeStyles = {
    sm: {
      padding: '0.25rem',
    },
    md: {
      padding: '0.5rem',
    },
    lg: {
      padding: '0.75rem',
    },
  }

  const currentVariant = variantStyles[variant]
  const currentSize = sizeStyles[size]

  const baseStyle: React.CSSProperties = {
    ...currentSize,
    border: currentVariant.border,
    backgroundColor: 'transparent',
    color: currentVariant.color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = currentVariant.hoverBg
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = 'transparent'
    }
  }

  return (
    <button
      className={className}
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      title={title}
      type="button"
    >
      {icon}
    </button>
  )
}

