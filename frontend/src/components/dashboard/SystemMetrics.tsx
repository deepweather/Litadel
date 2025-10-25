import React from 'react'
import { useAnalyses } from '../../hooks/useAnalyses'
import { ASCIIBox } from '../ui/ASCIIBox'
import { ProgressBar } from '../ui/ProgressBar'

export const SystemMetrics: React.FC = () => {
  const { data: analysesData } = useAnalyses(1, 100)

  const analyses = analysesData?.items || []
  const totalCount = analyses.length
  const runningCount = analyses.filter((a) => a.status === 'running').length
  const completedCount = analyses.filter((a) => a.status === 'completed').length
  const failedCount = analyses.filter((a) => a.status === 'failed').length

  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <ASCIIBox title="SYSTEM METRICS">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-terminal-dim text-xs mb-1">TOTAL ANALYSES</div>
            <div className="text-terminal-fg text-2xl font-bold">{totalCount}</div>
          </div>
          <div>
            <div className="text-terminal-dim text-xs mb-1">RUNNING</div>
            <div className="text-terminal-accent text-2xl font-bold">{runningCount}</div>
          </div>
          <div>
            <div className="text-terminal-dim text-xs mb-1">COMPLETED</div>
            <div className="text-terminal-fg text-2xl font-bold">{completedCount}</div>
          </div>
          <div>
            <div className="text-terminal-dim text-xs mb-1">FAILED</div>
            <div className="text-terminal-error text-2xl font-bold">{failedCount}</div>
          </div>
        </div>

        <div>
          <div className="text-terminal-dim text-xs mb-2">COMPLETION RATE</div>
          <ProgressBar percentage={completionRate} />
        </div>

        <div className="border-t border-terminal-border pt-3 mt-3">
          <div className="text-terminal-dim text-xs mb-2">SYSTEM LOAD</div>
          <ProgressBar percentage={(runningCount / 4) * 100} showPercentage={false} />
          <div className="text-terminal-dim text-xs mt-1">
            {runningCount} / 4 concurrent analyses
          </div>
        </div>
      </div>
    </ASCIIBox>
  )
}
