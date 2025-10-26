import React from 'react'
import { useAnalyses } from '../../hooks/useAnalyses'
import { Progress } from '../ui/progress'
import { CheckCircle2, Loader2, TrendingUp, XCircle } from 'lucide-react'

export const SystemMetrics: React.FC = () => {
  const { data: analysesData } = useAnalyses(1, 100)

  const analyses = analysesData?.items || []
  const totalCount = analyses.length
  const runningCount = analyses.filter((a) => a.status === 'running').length
  const completedCount = analyses.filter((a) => a.status === 'completed').length
  const failedCount = analyses.filter((a) => a.status === 'failed').length

  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const systemLoad = (runningCount / 4) * 100

  return (
    <div className="space-y-6 font-mono">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3 text-muted-foreground" />
            <div className="text-muted-foreground text-xs">TOTAL</div>
          </div>
          <div className="text-foreground text-3xl font-bold">{totalCount}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Loader2 className="size-3 text-chart-2" />
            <div className="text-muted-foreground text-xs">RUNNING</div>
          </div>
          <div className="text-chart-2 text-3xl font-bold">{runningCount}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3 text-chart-4" />
            <div className="text-muted-foreground text-xs">COMPLETED</div>
          </div>
          <div className="text-foreground text-3xl font-bold">{completedCount}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <XCircle className="size-3 text-destructive" />
            <div className="text-muted-foreground text-xs">FAILED</div>
          </div>
          <div className="text-destructive text-3xl font-bold">{failedCount}</div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-xs">COMPLETION RATE</div>
          <div className="text-foreground text-sm font-bold">{completionRate.toFixed(0)}%</div>
        </div>
        <Progress value={completionRate} className="h-2" />
      </div>

      {/* System Load */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-xs">SYSTEM LOAD</div>
          <div className="text-muted-foreground text-xs">
            {runningCount} / 4 concurrent
          </div>
        </div>
        <Progress
          value={systemLoad}
          className="h-2"
        />
      </div>
    </div>
  )
}
