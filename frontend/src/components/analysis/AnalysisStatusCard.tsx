import React, { useEffect, useState } from 'react'
import type { Analysis } from '../../types/api'
import { formatDateTime, formatDuration } from '../../utils/formatters'
import { AGENT_NAMES } from '../../types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Clock, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisStatusCardProps {
  analysis: Analysis
}

export const AnalysisStatusCard: React.FC<AnalysisStatusCardProps> = ({ analysis }) => {
  // Keep a ticking clock so duration updates in real time while running
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    if (analysis.status === 'running') {
      const timer = setInterval(() => setNow(new Date()), 1000)
      return () => clearInterval(timer)
    }
  }, [analysis.status])

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'running':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'pending':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const duration = analysis.completed_at
    ? formatDuration(analysis.created_at, analysis.completed_at)
    : analysis.created_at
      ? formatDuration(analysis.created_at, now)
      : null

  // Derive a sane progress based on the current agent position in the pipeline.
  const totalAgents = AGENT_NAMES.length
  let derivedProgress: number | null = null
  if (analysis.status === 'running' && analysis.current_agent) {
    const idx = AGENT_NAMES.indexOf(analysis.current_agent as any)
    if (idx >= 0) {
      derivedProgress = Math.floor((idx / totalAgents) * 100)
    }
  }

  const progressToShow =
    derivedProgress !== null
      ? derivedProgress
      : analysis.progress_percentage !== undefined
        ? Math.max(0, Math.min(100, Math.floor(analysis.progress_percentage)))
        : null

  return (
    <Card className="py-3 gap-3">
      <CardHeader className="pb-0 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono">Status</CardTitle>
          <Badge
            variant={getStatusVariant(analysis.status)}
            className={cn(
              'font-mono text-xs',
              analysis.status === 'running' && 'animate-pulse'
            )}
            role="status"
            aria-live="polite"
            aria-label={`Analysis status: ${analysis.status}`}
          >
            {analysis.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 py-0">
        {/* Progress */}
        {analysis.status === 'running' && progressToShow !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-semibold">{progressToShow}%</span>
            </div>
            <Progress
              value={progressToShow}
              className="h-1"
              aria-label={`Analysis progress: ${progressToShow}%`}
            />
          </div>
        )}

        {/* Current Agent */}
        {analysis.current_agent && (
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Cpu className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-mono">Agent</span>
            </div>
            <span className="text-xs font-mono text-primary text-right">
              {analysis.current_agent}
            </span>
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-mono">Duration</span>
            </div>
            <span className="text-xs font-mono text-primary">{duration}</span>
          </div>
        )}

        <Separator />

        {/* Timestamps */}
        <div className="space-y-1 text-xs font-mono text-muted-foreground">
          <div className="flex justify-between gap-2">
            <span>Started:</span>
            <span className="text-right">{formatDateTime(analysis.created_at)}</span>
          </div>
          {analysis.completed_at && (
            <div className="flex justify-between gap-2">
              <span>Completed:</span>
              <span className="text-right">{formatDateTime(analysis.completed_at)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
