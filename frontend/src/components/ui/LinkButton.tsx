import React from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface LinkButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'accent'
  disabled?: boolean
  className?: string
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  // Map old variant names to shadcn Button variants
  // Both 'primary' and 'accent' map to 'outline' for a clean, modern look
  const buttonVariant = 'outline' as const

  return (
    <Button
      variant={buttonVariant}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'font-mono',
        variant === 'accent' && 'border-primary/50 text-primary hover:bg-primary/10',
        className
      )}
    >
      {children}
    </Button>
  )
}

