import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Analysis } from '../../types/api'
import { formatDuration } from '../../utils/formatters'
import { ChevronRight, Clock, Minus, TrendingDown, TrendingUp } from 'lucide-react'

interface AnalysisCardProps {
  analysis: Analysis
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  const navigate = useNavigate()

  // Get trading decision from API
  const tradeDecision = analysis.trading_decision

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00ff00'
      case 'running':
        return '#00d4ff'
      case 'failed':
        return '#ff4444'
      case 'pending':
        return '#ffaa00'
      default:
        return '#4da6ff'
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'BUY':
        return '#00ff00'
      case 'SELL':
        return '#ff4444'
      case 'HOLD':
        return '#ffaa00'
      default:
        return '#4da6ff'
    }
  }

  const duration = analysis.completed_at
    ? formatDuration(new Date(analysis.created_at), new Date(analysis.completed_at))
    : null

  return (
    <div
      onClick={() => navigate(`/analyses/${analysis.id}`)}
      style={{
        border:
          analysis.status === 'running' ? '2px solid #00d4ff' : '1px solid rgba(77, 166, 255, 0.3)',
        backgroundColor: analysis.status === 'running' ? 'rgba(0, 212, 255, 0.02)' : 'transparent',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'JetBrains Mono, monospace',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#4da6ff'
        e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor =
          analysis.status === 'running' ? '#00d4ff' : 'rgba(77, 166, 255, 0.3)'
        e.currentTarget.style.backgroundColor =
          analysis.status === 'running' ? 'rgba(0, 212, 255, 0.02)' : 'transparent'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        {/* Left side */}
        <div style={{ flex: 1 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}
          >
            {/* Ticker */}
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#00d4ff' }}>
              {analysis.ticker}
            </span>

            {/* Decision or Status */}
            {analysis.status === 'completed' && tradeDecision ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {tradeDecision.decision === 'BUY' && (
                  <TrendingUp size={20} color={getDecisionColor('BUY')} />
                )}
                {tradeDecision.decision === 'SELL' && (
                  <TrendingDown size={20} color={getDecisionColor('SELL')} />
                )}
                {tradeDecision.decision === 'HOLD' && (
                  <Minus size={20} color={getDecisionColor('HOLD')} />
                )}
                <span
                  style={{
                    color: getDecisionColor(tradeDecision.decision),
                    fontWeight: 'bold',
                    fontSize: '1rem',
                  }}
                >
                  {tradeDecision.decision}
                </span>
                {tradeDecision.confidence && (
                  <span style={{ color: '#5a6e7a', fontSize: '0.875rem' }}>
                    ({tradeDecision.confidence}%)
                  </span>
                )}
              </div>
            ) : (
              <span
                style={{
                  color: getStatusColor(analysis.status),
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}
              >
                {analysis.status.toUpperCase()}
              </span>
            )}
          </div>

          {/* Date, Duration, and Owner */}
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: '#5a6e7a' }}>
            <span>{analysis.analysis_date}</span>
            {duration && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} />
                {duration}
              </span>
            )}
            {analysis.owner_username && (
              <span style={{ color: '#4da6ff' }}>
                Owner: {analysis.owner_username}
              </span>
            )}
            <span>ID: {analysis.id.slice(0, 8)}</span>
          </div>

          {/* Progress bar for running analyses */}
          {analysis.status === 'running' && analysis.progress_percentage !== undefined && (
            <div style={{ marginTop: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: '#00d4ff' }}>
                  {analysis.current_agent || 'Processing...'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#00d4ff' }}>
                  {analysis.progress_percentage}%
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  backgroundColor: 'rgba(0, 212, 255, 0.2)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${analysis.progress_percentage}%`,
                    backgroundColor: '#00d4ff',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {analysis.status === 'failed' && analysis.error_message && (
            <div
              style={{
                marginTop: '0.5rem',
                fontSize: '0.7rem',
                color: '#ff4444',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Error: {analysis.error_message}
            </div>
          )}
        </div>

        {/* Right side - Arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#4da6ff',
            marginLeft: '1rem',
          }}
        >
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  )
}
