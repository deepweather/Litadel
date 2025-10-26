import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyses } from '../../hooks/useAnalyses'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { getStatusIcon } from '../../utils/ascii'
import { formatDateTime } from '../../utils/formatters'

const getStatusColorClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 dark:text-green-400'
    case 'running':
      return 'text-blue-600 dark:text-blue-400'
    case 'failed':
      return 'text-destructive'
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400'
    default:
      return 'text-primary'
  }
}

export const RecentActivity: React.FC = () => {
  const navigate = useNavigate()
  const { data: analysesData } = useAnalyses(1, 10)

  const recentAnalyses = analysesData?.items || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>RECENT ACTIVITY</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="space-y-2">
          {recentAnalyses.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No recent activity</div>
          ) : (
            recentAnalyses.map((analysis) => {
              const icon = getStatusIcon(analysis.status)
              const colorClass = getStatusColorClass(analysis.status)

              return (
                <div
                  key={analysis.id}
                  onClick={() => navigate(`/analyses/${analysis.id}`)}
                  className="border p-3 cursor-pointer hover:border-foreground transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono ${colorClass}`}>{icon}</span>
                      <div>
                        <div className="text-foreground font-bold">{analysis.ticker}</div>
                        <div className="text-muted-foreground text-xs">
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
                    <div className="text-blue-600 dark:text-blue-400 text-xs mt-2">
                      → {analysis.current_agent}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
