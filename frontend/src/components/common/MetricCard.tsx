import React from 'react'
import { Card, CardContent } from '../ui/card'
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
    <Card
      onClick={onClick}
      className={cn(
        'font-mono transition-all duration-200',
        highlighted && 'bg-accent/10',
        onClick && 'cursor-pointer hover:bg-accent/5'
      )}
      style={{ borderColor: borderColor || undefined }}
    >
      <CardContent className="p-4">
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
      </CardContent>
    </Card>
  )
}
