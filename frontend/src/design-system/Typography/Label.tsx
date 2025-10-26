import React from 'react'
import { cn } from '@/lib/utils'

interface LabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  required = false,
  className = '',
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-medium font-mono text-primary',
        required && 'after:content-["*"] after:ml-0.5 after:text-destructive',
        className
      )}
    >
      {children}
    </label>
  )
}
