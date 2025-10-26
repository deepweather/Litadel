import React from 'react'
import { cn } from '@/lib/utils'

interface TextProps {
  size?: 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'accent' | 'subdued' | 'dim' | 'success' | 'danger' | 'warning'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  as?: 'p' | 'span' | 'div'
}

const variantClasses = {
  primary: 'text-primary',
  accent: 'text-secondary',
  subdued: 'text-muted-foreground',
  dim: 'text-muted',
  success: 'text-green-500',
  danger: 'text-destructive',
  warning: 'text-yellow-500',
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

export const Text: React.FC<TextProps> = ({
  size = 'base',
  variant = 'primary',
  weight = 'normal',
  children,
  className = '',
  style,
  as: Component = 'p',
}) => {
  const classes = cn(
    sizeClasses[size],
    variantClasses[variant],
    weightClasses[weight],
    'font-mono',
    className
  )

  return (
    <Component className={classes} style={style}>
      {children}
    </Component>
  )
}
