import React, { useState } from 'react'
import { AlertCircle, Check, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react'
import type { ExtractedParameters } from '../../types/trading'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ParameterApprovalCardProps {
  parameters: ExtractedParameters
  confidence: Record<string, number>
  suggestedDefaults?: Record<string, any>
  onApprove: () => void
  onCancel: () => void
}

export const ParameterApprovalCard: React.FC<ParameterApprovalCardProps> = ({
  parameters,
  confidence,
  suggestedDefaults = {},
  onApprove,
  onCancel
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const getConfidenceColorClass = (score: number) => {
    if (score >= 0.8) return 'text-blue-500' // High
    if (score >= 0.6) return 'text-orange-500' // Medium
    return 'text-red-500' // Low
  }

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle2 size={14} />
    return <AlertCircle size={14} />
  }

  const getIntentBadge = (intent?: string) => {
    const badgeStyles: Record<string, { className: string; emoji: string }> = {
      backtest: { className: 'bg-primary/20 border-primary text-primary', emoji: '🧪' },
      live_trading: { className: 'bg-red-500/20 border-red-500 text-red-500', emoji: '🔴' },
      analysis: { className: 'bg-green-500/20 border-green-500 text-green-500', emoji: '📊' }
    }

    const config = badgeStyles[intent || 'backtest'] || badgeStyles.backtest

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-bold font-mono ${config.className}`}>
        <span>{config.emoji}</span>
        <span>{intent?.toUpperCase().replace('_', ' ')}</span>
      </div>
    )
  }

  const getStrategyTypeBadge = (strategyType?: string) => {
    if (!strategyType) return null

    const badgeStyles: Record<string, { className: string; emoji: string; label: string }> = {
      agent_managed: { className: 'bg-purple-500/20 border-purple-400 text-purple-400', emoji: '🤖', label: 'AI-Managed' },
      technical_dsl: { className: 'bg-blue-500/20 border-blue-500 text-blue-500', emoji: '📊', label: 'Technical DSL' }
    }

    const config = badgeStyles[strategyType] || badgeStyles.agent_managed

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-bold font-mono ${config.className}`}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </div>
    )
  }

  const formatValue = (key: string, value: any) => {
    if (key === 'capital') {
      return `$${value.toLocaleString('en-US')}`
    }
    if (key === 'ticker_list' && Array.isArray(value)) {
      if (value.length === 0) {
        return '🤖 AI-Managed Portfolio (no specific tickers)'
      }
      return value.join(', ')
    }
    if (key === 'start_date' || key === 'end_date') {
      return new Date(value).toLocaleDateString('en-US')
    }
    return value
  }

  const mainParams = ['strategy_description', 'capital', 'start_date', 'end_date', 'ticker_list']
  const displayParams = Object.entries(parameters).filter(([key, value]) => {
    // Always show ticker_list even if empty (to show AI-managed message)
    if (key === 'ticker_list') return true
    // For other params, filter out empty values
    return mainParams.includes(key) && value !== undefined && value !== null && value !== ''
  })

  return (
    <Card className="p-6 border-2 border-blue-500 bg-blue-500/5 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-blue-500 text-base font-bold m-0">
          ✓ I've extracted these parameters:
        </h3>
        <div className="flex gap-2 flex-wrap">
          {getIntentBadge(parameters.intent)}
          {getStrategyTypeBadge(parameters.strategy_type)}
        </div>
      </div>

      {/* Main Parameters */}
      <div className="flex flex-col gap-4 mb-6">
        {displayParams.map(([key, value]) => {
          const confidenceScore = confidence[key] || 1.0
          const formattedKey = key.replace(/_/g, ' ').toUpperCase()

          return (
            <div
              key={key}
              className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded"
            >
              <div className={`mt-0.5 ${getConfidenceColorClass(confidenceScore)}`}>
                {getConfidenceIcon(confidenceScore)}
              </div>
              <div className="flex-1">
                <div className="text-muted-foreground text-xs mb-1">
                  {formattedKey}
                </div>
                <div className="text-foreground text-sm break-words">
                  {formatValue(key, value)}
                </div>
              </div>
              <div className={`text-xs opacity-70 ${getConfidenceColorClass(confidenceScore)}`}>
                {Math.round(confidenceScore * 100)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Advanced Options Toggle */}
      {Object.keys(suggestedDefaults).length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 bg-primary/5 border border-border rounded text-primary text-sm cursor-pointer font-mono hover:bg-primary/10"
          >
            <span>Advanced Options (Auto-Defaults)</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-primary/[0.03] border border-primary/20 rounded">
              {Object.entries(suggestedDefaults).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between py-2 border-b border-primary/10"
                >
                  <span className="text-muted-foreground text-xs">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-primary text-xs font-bold">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-2 p-4 bg-blue-500/20 border-2 border-blue-500 text-blue-500 text-base font-bold font-mono rounded-lg hover:bg-blue-500/30 transition-all"
        >
          <Check size={20} />
          <span>OK - Looks Good!</span>
        </Button>

        <Button
          onClick={onCancel}
          variant="outline"
          className="px-6 py-4 border-2 border-muted-foreground/50 text-muted-foreground/50 text-base font-bold font-mono rounded-lg hover:border-red-500 hover:text-red-500 transition-all"
        >
          <X size={20} />
        </Button>
      </div>
    </Card>
  )
}

