import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyses } from '../../hooks/useAnalyses'
import { formatDateTime } from '../../utils/formatters'
import { Badge } from '../ui/badge'
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return {
        icon: <CheckCircle2 className="size-4" />,
        variant: 'default' as const,
        colorClass: 'text-chart-4',
      }
    case 'running':
      return {
        icon: <Loader2 className="size-4 animate-spin" />,
        variant: 'secondary' as const,
        colorClass: 'text-chart-2',
      }
    case 'failed':
      return {
        icon: <XCircle className="size-4" />,
        variant: 'destructive' as const,
        colorClass: 'text-destructive',
      }
    case 'pending':
      return {
        icon: <Clock className="size-4" />,
        variant: 'outline' as const,
        colorClass: 'text-muted-foreground',
      }
    default:
      return {
        icon: <Clock className="size-4" />,
        variant: 'outline' as const,
        colorClass: 'text-muted-foreground',
      }
  }
}

export const RecentActivity: React.FC = () => {
  const navigate = useNavigate()
  const { data: analysesData } = useAnalyses(1, 10)

  const recentAnalyses = analysesData?.items || []

  if (recentAnalyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground font-mono">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-sm">No recent activity</div>
      </div>
    )
  }

  return (
    <div className="space-y-2 font-mono">
      {recentAnalyses.map((analysis) => {
        const statusConfig = getStatusConfig(analysis.status)

        return (
          <div
            key={analysis.id}
            onClick={() => navigate(`/analyses/${analysis.id}`)}
            className="border border-border rounded-lg p-3 cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`mt-0.5 ${statusConfig.colorClass}`}>
                  {statusConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground font-bold text-sm">{analysis.ticker}</div>
                  <div className="text-muted-foreground text-xs">
                    {formatDateTime(analysis.created_at)}
                  </div>
                  {analysis.current_agent && (
                    <div className="text-chart-2 text-xs mt-1.5 truncate">
                      → {analysis.current_agent}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={statusConfig.variant} className="text-xs font-mono">
                  {analysis.status === 'running' && analysis.progress_percentage !== undefined
                    ? `${analysis.progress_percentage.toFixed(0)}%`
                    : analysis.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
