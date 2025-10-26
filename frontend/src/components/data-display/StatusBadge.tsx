import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed'
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const statusStyles = {
    pending: 'border-warning text-warning bg-warning/10',
    running: 'border-secondary text-secondary bg-secondary/10',
    completed: 'border-green-500 text-green-500 bg-green-500/10',
    failed: 'border-destructive text-destructive bg-destructive/10',
  }

  const sizeStyles = {
    sm: 'text-[0.625rem] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-bold uppercase font-mono',
        statusStyles[status],
        sizeStyles[size]
      )}
    >
      {status}
    </Badge>
  )
}
