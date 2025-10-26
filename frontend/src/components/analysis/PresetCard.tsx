import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PresetCardProps {
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
  variant?: 'default' | 'primary' | 'accent'
  isLoading?: boolean
  className?: string
}

export const PresetCard: React.FC<PresetCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  variant = 'default',
  isLoading = false,
  className,
}) => {
  const variantStyles = {
    default: 'hover:border-primary hover:bg-primary/5',
    primary: 'hover:border-primary hover:bg-primary/5',
    accent: 'hover:border-accent hover:bg-accent/5',
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.98] py-0 gap-0',
        variantStyles[variant],
        isLoading && 'opacity-50 pointer-events-none animate-pulse',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <CardContent className="p-2 flex items-center gap-1.5 pt-2">
        <div className={cn(
          'flex-shrink-0',
          variant === 'accent' ? 'text-accent' : 'text-primary'
        )}>
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold font-mono text-[11px] leading-tight mb-0.5">{title}</div>
          <div className="text-[9px] text-muted-foreground font-mono leading-tight">{description}</div>
        </div>
        {isLoading && (
          <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        )}
      </CardContent>
    </Card>
  )
}

