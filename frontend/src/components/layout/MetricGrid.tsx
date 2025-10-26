import React from 'react'
import { cn } from '@/lib/utils'

interface MetricGridProps {
  children: React.ReactNode
  columns?: number
  gap?: 'sm' | 'md' | 'lg'
}

export const MetricGrid: React.FC<MetricGridProps> = ({
  children,
  columns,
  gap = 'md',
}) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div
      className={cn(
        'grid',
        gapClasses[gap],
        columns
          ? `grid-cols-${columns}`
          : 'grid-cols-[repeat(auto-fit,minmax(200px,1fr))]'
      )}
    >
      {children}
    </div>
  )
}

