import React from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number | React.ReactNode
  color?: string
  highlighted?: boolean
  borderColor?: string
  icon?: React.ReactNode
  subValue?: string
  onClick?: () => void
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  color,
  highlighted = false,
  borderColor,
  icon,
  subValue,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'border p-4 font-mono transition-all duration-200',
        highlighted ? 'bg-accent/10' : 'bg-transparent',
        onClick ? 'cursor-pointer hover:bg-accent/5' : 'cursor-default'
      )}
      style={{ borderColor: borderColor || undefined }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div className="text-sm text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: color || undefined }}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-muted-foreground mt-1">
          {subValue}
        </div>
      )}
    </div>
  )
}
