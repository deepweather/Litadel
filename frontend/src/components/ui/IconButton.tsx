import React from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface IconButtonProps {
  icon: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  title?: string
  disabled?: boolean
  className?: string
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  variant = 'primary',
  size = 'md',
  title,
  disabled = false,
  className = '',
}) => {
  // Map old variant names to shadcn Button variants
  const variantMap = {
    primary: 'outline' as const,
    danger: 'destructive' as const,
    secondary: 'ghost' as const,
    ghost: 'ghost' as const,
  }

  // Map old size names to shadcn Button sizes
  const sizeMap = {
    sm: 'icon-sm' as const,
    md: 'icon' as const,
    lg: 'icon-lg' as const,
  }

  return (
    <Button
      variant={variantMap[variant]}
      size={sizeMap[size]}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn('shrink-0', className)}
    >
      {icon}
    </Button>
  )
}

