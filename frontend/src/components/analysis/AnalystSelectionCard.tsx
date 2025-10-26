import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalystType } from '../../types/analysis'

interface AnalystSelectionCardProps {
  analystType: AnalystType
  description: string
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}

export const AnalystSelectionCard: React.FC<AnalystSelectionCardProps> = ({
  analystType,
  description,
  selected,
  onToggle,
  disabled = false,
}) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 ease-out hover:border-primary/50 hover:shadow-sm active:scale-[0.99] py-0 gap-0',
        selected && 'border-primary bg-primary/5 shadow-sm',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onToggle()}
    >
      <CardContent className="p-2 pt-2">
        <div className="flex items-start gap-2">
          <Checkbox
            checked={selected}
            onCheckedChange={() => !disabled && onToggle()}
            disabled={disabled}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold uppercase leading-tight">
              {analystType}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info size={10} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

