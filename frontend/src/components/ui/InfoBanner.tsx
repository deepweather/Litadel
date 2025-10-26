import React from 'react'

type BannerVariant = 'info' | 'success' | 'warning' | 'error'

interface InfoBannerProps {
  variant?: BannerVariant
  icon?: React.ReactNode
  title?: string
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BannerVariant, { border: string; background: string; color: string }> = {
  info: {
    border: '1px solid rgba(0, 212, 255, 0.3)',
    background: 'rgba(0, 212, 255, 0.05)',
    color: '#00d4ff',
  },
  success: {
    border: '1px solid rgba(76, 175, 80, 0.3)',
    background: 'rgba(76, 175, 80, 0.05)',
    color: '#4caf50',
  },
  warning: {
    border: '1px solid rgba(255, 165, 0, 0.3)',
    background: 'rgba(255, 165, 0, 0.05)',
    color: '#ff9900',
  },
  error: {
    border: '2px solid #ff4444',
    background: 'rgba(255, 68, 68, 0.05)',
    color: '#ff4444',
  },
}

export const InfoBanner: React.FC<InfoBannerProps> = ({
  variant = 'info',
  icon,
  title,
  children,
  className = '',
}) => {
  const styles = variantStyles[variant]

  return (
    <div
      className={className}
      style={{
        border: styles.border,
        backgroundColor: styles.background,
        padding: '0.75rem',
        marginTop: '0.5rem',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.75rem',
        color: styles.color,
      }}
    >
      {title && (
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon && <span>{icon}</span>}
          {title}
        </div>
      )}
      {!title && icon && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <span>{icon}</span>
          <div style={{ flex: 1 }}>{children}</div>
        </div>
      )}
      {!title && !icon && children}
      {title && children}
    </div>
  )
}

