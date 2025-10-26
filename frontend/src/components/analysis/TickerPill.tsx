import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TickerPillProps {
  ticker: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export const TickerPill: React.FC<TickerPillProps> = ({
  ticker,
  selected = false,
  onClick,
  className,
}) => {
  return (
    <Badge
      variant={selected ? 'default' : 'outline'}
      className={cn(
        'cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 font-mono text-xs px-3 py-1.5',
        selected && 'ring-2 ring-primary/20 shadow-sm',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {ticker}
    </Badge>
  )
}

