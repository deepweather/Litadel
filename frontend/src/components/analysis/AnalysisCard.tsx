import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Analysis } from '../../types/api'
import { formatDuration } from '../../utils/formatters'
import { ChevronRight, Clock, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface AnalysisCardProps {
  analysis: Analysis
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  const navigate = useNavigate()

  // Get trading decision from API
  const tradeDecision = analysis.trading_decision

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

  const getDecisionColorClass = (decision: string) => {
    switch (decision) {
      case 'BUY':
        return 'text-green-600 dark:text-green-400'
      case 'SELL':
        return 'text-red-600 dark:text-red-400'
      case 'HOLD':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-primary'
    }
  }

  const getIconColor = (decision: string) => {
    switch (decision) {
      case 'BUY':
        return 'rgb(22 163 74)' // green-600
      case 'SELL':
        return 'rgb(220 38 38)' // red-600
      case 'HOLD':
        return 'rgb(202 138 4)' // yellow-600
      default:
        return 'currentColor'
    }
  }

  const duration = analysis.completed_at
    ? formatDuration(new Date(analysis.created_at), new Date(analysis.completed_at))
    : null

  return (
    <Card
      onClick={() => navigate(`/analyses/${analysis.id}`)}
      className={`cursor-pointer transition-all hover:shadow-md p-4 ${
        analysis.status === 'running' ? 'border-blue-500 border-2 bg-blue-500/5' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        {/* Left side */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            {/* Ticker */}
            <span
              className="text-xl font-bold text-primary cursor-pointer underline"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/asset/${analysis.ticker}`)
              }}
              title="View asset details"
            >
              {analysis.ticker}
            </span>

            {/* Decision or Status */}
            {analysis.status === 'completed' && tradeDecision ? (
              <div className="flex items-center gap-2">
                {tradeDecision.decision === 'BUY' && (
                  <TrendingUp size={20} color={getIconColor('BUY')} />
                )}
                {tradeDecision.decision === 'SELL' && (
                  <TrendingDown size={20} color={getIconColor('SELL')} />
                )}
                {tradeDecision.decision === 'HOLD' && (
                  <Minus size={20} color={getIconColor('HOLD')} />
                )}
                <span className={`font-bold text-base ${getDecisionColorClass(tradeDecision.decision)}`}>
                  {tradeDecision.decision}
                </span>
                {tradeDecision.confidence && (
                  <span className="text-muted-foreground text-sm">
                    ({tradeDecision.confidence}%)
                  </span>
                )}
              </div>
            ) : (
              <span className={`text-sm font-bold ${getStatusColorClass(analysis.status)}`}>
                {analysis.status.toUpperCase()}
              </span>
            )}
          </div>

          {/* Date, Duration, and Owner */}
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>{analysis.analysis_date}</span>
            {duration && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {duration}
              </span>
            )}
            {analysis.owner_username && (
              <span className="text-foreground">
                Owner: {analysis.owner_username}
              </span>
            )}
            <span>ID: {analysis.id.slice(0, 8)}</span>
          </div>

          {/* Progress bar for running analyses */}
          {analysis.status === 'running' && analysis.progress_percentage !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-[0.7rem] text-blue-600 dark:text-blue-400">
                  {analysis.current_agent || 'Processing...'}
                </span>
                <span className="text-[0.7rem] text-blue-600 dark:text-blue-400">
                  {analysis.progress_percentage}%
                </span>
              </div>
              <div className="h-1 bg-blue-500/20 relative">
                <div
                  className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${analysis.progress_percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {analysis.status === 'failed' && analysis.error_message && (
            <div className="mt-2 text-[0.7rem] text-destructive overflow-hidden text-ellipsis whitespace-nowrap">
              Error: {analysis.error_message}
            </div>
          )}
        </div>

        {/* Right side - Arrow */}
        <div className="flex items-center text-foreground ml-4">
          <ChevronRight size={20} />
        </div>
      </div>
    </Card>
  )
}
