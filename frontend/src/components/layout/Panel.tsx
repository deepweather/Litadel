import React from 'react'
import { Card, CardContent } from '../ui/card'
import { cn } from '@/lib/utils'

interface PanelProps {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  highlighted?: boolean
  className?: string
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export const Panel: React.FC<PanelProps> = ({
  children,
  padding = 'md',
  border = true,
  highlighted = false,
  className = '',
}) => {
  if (!border) {
    return (
      <div className={cn(
        paddingClasses[padding],
        highlighted && 'bg-accent/5',
        'font-mono',
        className
      )}>
        {children}
      </div>
    )
  }

  return (
    <Card className={cn(
      'font-mono',
      highlighted && 'bg-accent/5',
      padding === 'none' && 'p-0',
      className
    )}>
      {padding === 'none' ? (
        children
      ) : (
        <CardContent className={paddingClasses[padding]}>
          {children}
        </CardContent>
      )}
    </Card>
  )
}

