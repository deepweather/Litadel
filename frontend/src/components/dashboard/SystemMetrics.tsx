import React from 'react'
import { useAnalyses } from '../../hooks/useAnalyses'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'

export const SystemMetrics: React.FC = () => {
  const { data: analysesData } = useAnalyses(1, 100)

  const analyses = analysesData?.items || []
  const totalCount = analyses.length
  const runningCount = analyses.filter((a) => a.status === 'running').length
  const completedCount = analyses.filter((a) => a.status === 'completed').length
  const failedCount = analyses.filter((a) => a.status === 'failed').length

  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>SYSTEM METRICS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-muted-foreground text-xs mb-1">TOTAL ANALYSES</div>
              <div className="text-foreground text-2xl font-bold">{totalCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-1">RUNNING</div>
              <div className="text-blue-600 dark:text-blue-400 text-2xl font-bold">{runningCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-1">COMPLETED</div>
              <div className="text-foreground text-2xl font-bold">{completedCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-1">FAILED</div>
              <div className="text-destructive text-2xl font-bold">{failedCount}</div>
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-xs mb-2">COMPLETION RATE</div>
            <Progress value={completionRate} />
            <div className="text-muted-foreground text-xs mt-1">{completionRate.toFixed(0)}%</div>
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="text-muted-foreground text-xs mb-2">SYSTEM LOAD</div>
            <Progress value={(runningCount / 4) * 100} />
            <div className="text-muted-foreground text-xs mt-1">
              {runningCount} / 4 concurrent analyses
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
