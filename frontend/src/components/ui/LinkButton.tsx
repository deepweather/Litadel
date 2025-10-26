import React from 'react'

interface LinkButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'accent'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  style = {},
}) => {
  const variantColors = {
    primary: {
      border: 'rgba(77, 166, 255, 0.3)',
      color: '#4da6ff',
      hoverBorder: '#4da6ff',
      hoverBg: 'rgba(77, 166, 255, 0.1)',
    },
    accent: {
      border: 'rgba(77, 166, 255, 0.3)',
      color: '#00d4ff',
      hoverBorder: '#00d4ff',
      hoverBg: 'rgba(0, 212, 255, 0.1)',
    },
  }

  const currentVariant = variantColors[variant]

  const baseStyle: React.CSSProperties = {
    border: `1px solid ${currentVariant.border}`,
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    color: currentVariant.color,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.875rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.borderColor = currentVariant.hoverBorder
      e.currentTarget.style.backgroundColor = currentVariant.hoverBg
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.borderColor = currentVariant.border
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
      type="button"
    >
      {children}
    </button>
  )
}

