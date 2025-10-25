import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyses } from '../../hooks/useAnalyses'
import { ASCIIBox } from '../ui/ASCIIBox'
import { getStatusIcon } from '../../utils/ascii'
import { formatDateTime, getStatusColor } from '../../utils/formatters'

export const RecentActivity: React.FC = () => {
  const navigate = useNavigate()
  const { data: analysesData } = useAnalyses(1, 10)

  const recentAnalyses = analysesData?.items || []

  return (
    <ASCIIBox title="RECENT ACTIVITY" scrollable>
      <div className="space-y-2">
        {recentAnalyses.length === 0 ? (
          <div className="text-terminal-dim text-center py-8">No recent activity</div>
        ) : (
          recentAnalyses.map((analysis) => {
            const icon = getStatusIcon(analysis.status)
            const colorClass = getStatusColor(analysis.status)

            return (
              <div
                key={analysis.id}
                onClick={() => navigate(`/analyses/${analysis.id}`)}
                className="border border-terminal-border p-3 cursor-pointer hover:border-terminal-fg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`font-mono ${colorClass}`}>{icon}</span>
                    <div>
                      <div className="text-terminal-fg font-bold">{analysis.ticker}</div>
                      <div className="text-terminal-dim text-xs">
                        {formatDateTime(analysis.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs font-mono ${colorClass}`}>
                    {analysis.status === 'running' && analysis.progress_percentage !== undefined
                      ? `${analysis.progress_percentage.toFixed(0)}%`
                      : analysis.status.toUpperCase()}
                  </div>
                </div>
                {analysis.current_agent && (
                  <div className="text-terminal-accent text-xs mt-2">
                    → {analysis.current_agent}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </ASCIIBox>
  )
}
