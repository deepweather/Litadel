import React, { useEffect, useState } from 'react'
import type { Analysis } from '../../types/api'
import { formatDateTime, formatDuration } from '../../utils/formatters'
import { AGENT_NAMES } from '../../types/analysis'

interface AnalysisStatusCardProps {
  analysis: Analysis
}

export const AnalysisStatusCard: React.FC<AnalysisStatusCardProps> = ({ analysis }) => {
  // Keep a ticking clock so duration updates in real time while running
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    if (analysis.status === 'running') {
      const timer = setInterval(() => setNow(new Date()), 1000)
      return () => clearInterval(timer)
    }
  }, [analysis.status])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'hsl(var(--success))'
      case 'running':
        return 'hsl(var(--accent))'
      case 'failed':
        return 'hsl(var(--destructive))'
      case 'pending':
        return 'hsl(var(--warning))'
      default:
        return 'hsl(var(--primary))'
    }
  }

  const duration = analysis.completed_at
    ? formatDuration(analysis.created_at, analysis.completed_at)
    : analysis.created_at
      ? formatDuration(analysis.created_at, now)
      : null

  // Derive a sane progress based on the current agent position in the pipeline.
  // This avoids cases where the backend sends an out-of-sync percentage.
  const totalAgents = AGENT_NAMES.length
  let derivedProgress: number | null = null
  if (analysis.status === 'running' && analysis.current_agent) {
    const idx = AGENT_NAMES.indexOf(analysis.current_agent as any)
    if (idx >= 0) {
      // Progress reflects how many agents are completed before the current one
      derivedProgress = Math.floor((idx / totalAgents) * 100)
    }
  }

  const progressToShow =
    derivedProgress !== null
      ? derivedProgress
      : analysis.progress_percentage !== undefined
        ? Math.max(0, Math.min(100, Math.floor(analysis.progress_percentage)))
        : null

  return (
    <div
      style={{
        border: '1px solid hsl(var(--border))',
        padding: '1rem',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.75rem',
      }}
    >
      {/* Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>STATUS</span>
        <span
          style={{
            color: getStatusColor(analysis.status),
            fontWeight: 'bold',
          }}
        >
          {analysis.status.toUpperCase()}
        </span>
      </div>

      {/* Progress */}
      {analysis.status === 'running' && progressToShow !== null && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
            }}
          >
            <span style={{ color: '#5a6e7a' }}>PROGRESS</span>
            <span style={{ color: '#00d4ff' }}>{progressToShow}%</span>
          </div>
          <div
            style={{
              height: '4px',
              backgroundColor: 'hsl(var(--primary) / 0.2)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${progressToShow}%`,
                backgroundColor: '#00d4ff',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Current Agent */}
      {analysis.current_agent && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <span style={{ color: '#5a6e7a' }}>AGENT</span>
          <span
            style={{
              color: '#4da6ff',
              fontSize: '0.7rem',
            }}
          >
            {analysis.current_agent}
          </span>
        </div>
      )}

      {/* Duration */}
      {duration && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <span style={{ color: '#5a6e7a' }}>DURATION</span>
          <span style={{ color: '#4da6ff' }}>{duration}</span>
        </div>
      )}

      {/* Timestamps */}
      <div
        style={{
          paddingTop: '0.75rem',
          borderTop: '1px solid hsl(var(--primary) / 0.2)',
          fontSize: '0.65rem',
          color: '#5a6e7a',
        }}
      >
        <div style={{ marginBottom: '0.25rem' }}>
          Started: {formatDateTime(analysis.created_at)}
        </div>
        {analysis.completed_at && <div>Completed: {formatDateTime(analysis.completed_at)}</div>}
      </div>
    </div>
  )
}
