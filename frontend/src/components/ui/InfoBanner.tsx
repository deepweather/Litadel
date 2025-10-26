import React from 'react'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { cn } from '@/lib/utils'

type BannerVariant = 'info' | 'success' | 'warning' | 'error'

interface InfoBannerProps {
  variant?: BannerVariant
  icon?: React.ReactNode
  title?: string
  children: React.ReactNode
  className?: string
}

export const InfoBanner: React.FC<InfoBannerProps> = ({
  variant = 'info',
  icon,
  title,
  children,
  className = '',
}) => {
  // Map old variant names to shadcn Alert variants
  const alertVariant = variant === 'error' ? 'destructive' : 'default'

  // Add variant-specific styling through Tailwind classes
  const variantClasses = {
    info: 'border-primary/30 bg-primary/5 text-primary',
    success: 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400',
    warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400',
    error: '', // Uses destructive variant styling
  }

  return (
    <Alert
      variant={alertVariant}
      className={cn(
        'font-mono',
        variantClasses[variant],
        className
      )}
    >
      {icon}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

