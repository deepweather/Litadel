import React from 'react'
import { cn } from '@/lib/utils'

interface HeadingProps {
  level?: 1 | 2 | 3 | 4
  variant?: 'primary' | 'accent' | 'default' | 'subdued'
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const variantClasses = {
  primary: 'text-primary',
  accent: 'text-secondary',
  default: 'text-foreground',
  subdued: 'text-muted-foreground',
}

const sizeClasses = {
  1: 'text-2xl',
  2: 'text-xl',
  3: 'text-lg',
  4: 'text-base',
}

export const Heading: React.FC<HeadingProps> = ({
  level = 1,
  variant = 'primary',
  children,
  className = '',
  style,
}) => {
  const classes = cn(
    sizeClasses[level],
    'font-bold font-mono',
    variantClasses[variant],
    className
  )

  switch (level) {
    case 1:
      return <h1 className={classes} style={style}>{children}</h1>
    case 2:
      return <h2 className={classes} style={style}>{children}</h2>
    case 3:
      return <h3 className={classes} style={style}>{children}</h3>
    case 4:
      return <h4 className={classes} style={style}>{children}</h4>
    default:
      return <h1 className={classes} style={style}>{children}</h1>
  }
}
