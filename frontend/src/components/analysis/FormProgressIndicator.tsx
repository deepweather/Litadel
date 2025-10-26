import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormProgressIndicatorProps {
  steps: {
    label: string
    completed: boolean
  }[]
  className?: string
}

export const FormProgressIndicator: React.FC<FormProgressIndicatorProps> = ({
  steps,
  className,
}) => {
  const completedCount = steps.filter((s) => s.completed).length
  const totalCount = steps.length
  const percentage = Math.round((completedCount / totalCount) * 100)

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-mono font-bold">Form Progress</div>
          <div className="text-xs font-mono text-muted-foreground">
            {completedCount}/{totalCount} complete
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-1.5">
              {step.completed ? (
                <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
              ) : (
                <Circle size={12} className="text-muted-foreground flex-shrink-0" />
              )}
              <span
                className={cn(
                  'text-[10px] font-mono',
                  step.completed ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

