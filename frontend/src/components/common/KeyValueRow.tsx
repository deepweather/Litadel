import React from 'react'
import { cn } from '@/lib/utils'

interface KeyValueRowProps {
  label: string
  value: React.ReactNode
  labelColor?: string
  valueColor?: string
  valueBold?: boolean
  divider?: boolean
  className?: string
}

export const KeyValueRow: React.FC<KeyValueRowProps> = ({
  label,
  value,
  labelColor,
  valueColor,
  valueBold = false,
  divider = true,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'flex justify-between items-center font-mono text-sm',
        divider && 'pb-4 border-b border-border',
        className
      )}
    >
      <span
        className={labelColor ? '' : 'text-muted-foreground'}
        style={labelColor ? { color: labelColor } : undefined}
      >
        {label}
      </span>
      <span
        className={cn(
          valueColor ? '' : 'text-foreground',
          valueBold && 'font-bold'
        )}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  )
}

