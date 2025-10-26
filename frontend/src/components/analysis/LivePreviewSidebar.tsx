import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalystType } from '../../types/analysis'

interface LivePreviewSidebarProps {
  ticker: string
  analysisDate: string
  selectedAnalysts: AnalystType[]
  researchDepth: number
  estimatedMinutes: number
  onSubmit: () => void
  isSubmitting: boolean
  isValid: boolean
  className?: string
  completionPercentage?: number
}

const getDepthLabel = (depth: number) => {
  switch (depth) {
    case 1:
      return 'Basic'
    case 2:
      return 'Standard'
    case 3:
      return 'Deep'
    default:
      return 'Basic'
  }
}

export const LivePreviewSidebar: React.FC<LivePreviewSidebarProps> = ({
  ticker,
  analysisDate,
  selectedAnalysts,
  researchDepth,
  estimatedMinutes,
  onSubmit,
  isSubmitting,
  isValid,
  className,
  completionPercentage = 0,
}) => {
  const hasBasicInfo = ticker && analysisDate
  const hasAnalysts = selectedAnalysts.length > 0
  const isReadyToSubmit = hasBasicInfo && hasAnalysts && isValid

  return (
    <Card className={cn('sticky top-0', className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            Analysis Preview
            {isReadyToSubmit && (
              <CheckCircle size={16} className="text-green-500" />
            )}
          </span>
          <span className="text-xs font-mono text-muted-foreground font-normal">
            {completionPercentage}%
          </span>
        </CardTitle>
        {/* Progress Bar */}
        {completionPercentage < 100 && (
          <div className="relative h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Ticker & Date */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-mono">TICKER</div>
          {ticker ? (
            <div className="text-base font-bold font-mono text-primary">
              {ticker.toUpperCase()}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">Not selected</div>
          )}
        </div>

        <Separator />

        {/* Date */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-mono">DATE</div>
          {analysisDate ? (
            <div className="text-xs font-mono">{analysisDate}</div>
          ) : (
            <div className="text-xs text-muted-foreground italic">Not selected</div>
          )}
        </div>

        <Separator />

        {/* Analysts */}
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground font-mono">
            ANALYSTS ({selectedAnalysts.length})
          </div>
          {selectedAnalysts.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedAnalysts.map((analyst) => (
                <Badge key={analyst} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                  {analyst.toUpperCase()}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">None selected</div>
          )}
        </div>

        <Separator />

        {/* Research Depth */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-mono">RESEARCH DEPTH</div>
          <div className="text-xs font-mono">
            {getDepthLabel(researchDepth)} (Level {researchDepth})
          </div>
        </div>

        <Separator />

        {/* Estimated Time */}
        <div className="p-2 border border-primary/30 bg-primary/5 rounded-md">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock size={12} className="text-primary" />
            <div className="text-[10px] text-muted-foreground font-mono">
              ESTIMATED TIME
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-primary">
            ~{estimatedMinutes} min
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={onSubmit}
          disabled={!isReadyToSubmit || isSubmitting}
          className="w-full"
          size="default"
        >
          {isSubmitting ? 'STARTING...' : 'START ANALYSIS'}
        </Button>

        {/* Validation Messages */}
        {!isReadyToSubmit && (
          <div className="flex items-start gap-2 p-2 border border-muted bg-muted/20 rounded-md">
            <AlertCircle size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-[10px] text-muted-foreground font-mono leading-tight">
              {!hasBasicInfo && 'Please select a ticker and date. '}
              {!hasAnalysts && 'Please select at least one analyst.'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

