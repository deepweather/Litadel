import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { cn } from '@/lib/utils'

interface ASCIIBoxProps {
  title?: string
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
  scrollable?: boolean
}

export const ASCIIBox: React.FC<ASCIIBoxProps> = ({
  title,
  children,
  variant = 'default',
  className = '',
  scrollable = false,
}) => {
  const variantClasses = {
    default: '',
    success: 'border-green-500 dark:border-green-500',
    warning: 'border-yellow-500 dark:border-yellow-500',
    error: 'border-destructive',
  }

  return (
    <Card
      className={cn(
        'font-mono',
        variantClasses[variant],
        scrollable && 'flex flex-col h-full',
        className
      )}
    >
      {title && (
        <CardHeader className={scrollable ? 'flex-shrink-0' : ''}>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(scrollable && 'flex-1 overflow-y-auto min-h-0', !title && 'pt-6')}>
        {children}
      </CardContent>
    </Card>
  )
}
