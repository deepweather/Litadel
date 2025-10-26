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
  // Map status to shadcn Badge variants
  const getVariant = (status: string) => {
    switch (status) {
      case 'failed':
        return 'destructive' as const
      case 'completed':
        return 'default' as const
      case 'running':
        return 'secondary' as const
      case 'pending':
      default:
        return 'outline' as const
    }
  }

  const statusStyles = {
    pending: 'border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400 bg-yellow-500/10',
    running: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-500/10',
    completed: 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 bg-green-500/10',
    failed: '', // destructive variant handles this
  }

  const sizeStyles = {
    sm: 'text-[0.625rem] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
  }

  return (
    <Badge
      variant={getVariant(status)}
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
