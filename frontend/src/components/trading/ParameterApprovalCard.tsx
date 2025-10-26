import React, { useState } from 'react'
import { AlertCircle, Check, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react'
import type { ExtractedParameters } from '../../types/trading'

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

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return '#00d4ff' // High
    if (score >= 0.6) return '#ffa500' // Medium
    return '#ff6b6b' // Low
  }

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle2 size={14} />
    return <AlertCircle size={14} />
  }

  const getIntentBadge = (intent?: string) => {
    const badgeColors: Record<string, { bg: string; color: string; emoji: string }> = {
      backtest: { bg: 'rgba(77, 166, 255, 0.2)', color: '#4da6ff', emoji: '🧪' },
      live_trading: { bg: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b', emoji: '🔴' },
      analysis: { bg: 'rgba(76, 175, 80, 0.2)', color: '#4caf50', emoji: '📊' }
    }

    const config = badgeColors[intent || 'backtest'] || badgeColors.backtest

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: config.bg,
        border: `1px solid ${config.color}`,
        borderRadius: '20px',
        color: config.color,
        fontSize: '0.875rem',
        fontWeight: 'bold',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <span>{config.emoji}</span>
        <span>{intent?.toUpperCase().replace('_', ' ')}</span>
      </div>
    )
  }

  const getStrategyTypeBadge = (strategyType?: string) => {
    if (!strategyType) return null

    const badgeColors: Record<string, { bg: string; color: string; emoji: string; label: string }> = {
      agent_managed: { bg: 'rgba(147, 51, 234, 0.2)', color: '#a78bfa', emoji: '🤖', label: 'AI-Managed' },
      technical_dsl: { bg: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff', emoji: '📊', label: 'Technical DSL' }
    }

    const config = badgeColors[strategyType] || badgeColors.agent_managed

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: config.bg,
        border: `1px solid ${config.color}`,
        borderRadius: '20px',
        color: config.color,
        fontSize: '0.875rem',
        fontWeight: 'bold',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
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
    <div style={{
      padding: '1.5rem',
      border: '2px solid #00d4ff',
      borderRadius: '8px',
      backgroundColor: 'rgba(0, 212, 255, 0.05)',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <h3 style={{
          color: '#00d4ff',
          fontSize: '1rem',
          fontWeight: 'bold',
          margin: 0
        }}>
          ✓ I've extracted these parameters:
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {getIntentBadge(parameters.intent)}
          {getStrategyTypeBadge(parameters.strategy_type)}
        </div>
      </div>

      {/* Main Parameters */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {displayParams.map(([key, value]) => {
          const confidenceScore = confidence[key] || 1.0
          const formattedKey = key.replace(/_/g, ' ').toUpperCase()

          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '4px'
              }}
            >
              <div style={{ color: getConfidenceColor(confidenceScore), marginTop: '0.125rem' }}>
                {getConfidenceIcon(confidenceScore)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#8899aa',
                  fontSize: '0.75rem',
                  marginBottom: '0.25rem'
                }}>
                  {formattedKey}
                </div>
                <div style={{
                  color: '#fff',
                  fontSize: '0.875rem',
                  wordBreak: 'break-word'
                }}>
                  {formatValue(key, value)}
                </div>
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: getConfidenceColor(confidenceScore),
                opacity: 0.7
              }}>
                {Math.round(confidenceScore * 100)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Advanced Options Toggle */}
      {Object.keys(suggestedDefaults).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              backgroundColor: 'rgba(77, 166, 255, 0.05)',
              border: '1px solid rgba(77, 166, 255, 0.3)',
              borderRadius: '4px',
              color: '#4da6ff',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            <span>Advanced Options (Auto-Defaults)</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div style={{
              marginTop: '0.75rem',
              padding: '1rem',
              backgroundColor: 'rgba(77, 166, 255, 0.03)',
              border: '1px solid rgba(77, 166, 255, 0.2)',
              borderRadius: '4px'
            }}>
              {Object.entries(suggestedDefaults).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid rgba(77, 166, 255, 0.1)'
                  }}
                >
                  <span style={{ color: '#8899aa', fontSize: '0.75rem' }}>
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span style={{ color: '#4da6ff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.75rem'
      }}>
        <button
          onClick={onApprove}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(0, 212, 255, 0.2)',
            border: '2px solid #00d4ff',
            borderRadius: '8px',
            color: '#00d4ff',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.2)'
          }}
        >
          <Check size={20} />
          <span>OK - Looks Good!</span>
        </button>

        <button
          onClick={onCancel}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'transparent',
            border: '2px solid #666',
            borderRadius: '8px',
            color: '#666',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ff6b6b'
            e.currentTarget.style.color = '#ff6b6b'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#666'
            e.currentTarget.style.color = '#666'
          }}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

