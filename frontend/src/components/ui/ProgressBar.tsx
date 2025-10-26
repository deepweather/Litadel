import React from 'react'
import { Progress } from './progress'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  percentage: number
  showPercentage?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  showPercentage = true,
  className = '',
}) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage))

  return (
    <div className={cn('flex items-center gap-3 font-mono', className)}>
      <Progress value={clampedPercentage} className="flex-1" />
      {showPercentage && (
        <span className="text-muted-foreground min-w-[3rem] text-right text-sm">
          {clampedPercentage.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
