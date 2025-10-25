import React, { useEffect, useRef, useState } from 'react'
import type { AnalysisLog } from '../../types/api'
import { formatTime } from '../../utils/formatters'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface LogViewerProps {
  logs: AnalysisLog[]
  autoScroll?: boolean
  analysisStartTime?: string
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  autoScroll = true,
  analysisStartTime,
}) => {
  const [filter, setFilter] = useState<string>('all')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const getRelativeTime = (timestamp: string) => {
    if (!analysisStartTime) return formatTime(timestamp)
    const start = new Date(analysisStartTime).getTime()
    const current = new Date(timestamp).getTime()
    const diff = Math.floor((current - start) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `[+${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`
  }

  const getAgentTransitions = () => {
    const transitions: Array<{ index: number; from: string; to: string }> = []
    let lastAgent = ''
    logs.forEach((log, index) => {
      if (log.agent_name !== lastAgent && lastAgent !== '') {
        transitions.push({ index, from: lastAgent, to: log.agent_name })
      }
      lastAgent = log.agent_name
    })
    return transitions
  }

  const transitions = getAgentTransitions()

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true
    return log.log_type === filter
  })

  const toggleExpanded = (logId: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  const getLogTypeColor = (logType: string) => {
    switch (logType) {
      case 'Tool Call':
        return 'text-terminal-accent'
      case 'Reasoning':
        return 'text-terminal-fg'
      case 'System':
        return 'text-terminal-warning'
      default:
        return 'text-terminal-dim'
    }
  }

  if (logs.length === 0) {
    return <div className="text-terminal-dim text-center py-8">No logs available yet</div>
  }

  return (
    <div className="space-y-3">
      {/* Filter buttons - sticky at top */}
      <div
        className="flex gap-2 bg-[#0a0f1a] pb-2"
        style={{ position: 'sticky', top: 0, zIndex: 10 }}
      >
        {['all', 'Tool Call', 'Reasoning', 'System'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`
              px-3 py-1 border font-mono text-xs
              transition-all
              ${
                filter === filterType
                  ? 'border-terminal-fg text-terminal-fg bg-terminal-highlight'
                  : 'border-terminal-border text-terminal-dim hover:text-terminal-fg'
              }
            `}
          >
            {filterType === 'all' ? 'ALL' : filterType.toUpperCase().replace(' ', '_')}
          </button>
        ))}
      </div>

      {/* Logs list */}
      <div className="space-y-1.5" style={{ minWidth: 0 }}>
        {filteredLogs.map((log) => {
          const isExpanded = expandedLogs.has(log.id)
          const isLongContent = log.content.length > 150
          const displayContent =
            isExpanded || !isLongContent ? log.content : log.content.slice(0, 150) + '...'

          // Check if there's an agent transition before this log
          const transition = transitions.find((t) => {
            const originalIndex = logs.findIndex((l) => l.id === log.id)
            return t.index === originalIndex
          })

          return (
            <React.Fragment key={log.id}>
              {/* Agent Transition Separator */}
              {transition && (
                <div
                  style={{
                    borderTop: '1px solid rgba(77, 166, 255, 0.3)',
                    padding: '0.25rem',
                    textAlign: 'center',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.65rem',
                    color: '#00d4ff',
                    fontWeight: 'bold',
                  }}
                >
                  ── {transition.from} → {transition.to} ──
                </div>
              )}

              <div
                className="border border-terminal-border p-2 hover:border-terminal-fg transition-colors"
                style={{
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  fontSize: '0.75rem',
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${getLogTypeColor(log.log_type)}`}>
                      [{log.log_type.toUpperCase()}]
                    </span>
                    <span className="text-terminal-accent text-xs font-mono">{log.agent_name}</span>
                  </div>
                  <span className="text-terminal-dim text-xs font-mono">
                    {getRelativeTime(log.timestamp)}
                  </span>
                </div>
                <pre
                  className="text-terminal-fg text-xs whitespace-pre-wrap font-mono"
                  style={{ overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '100%' }}
                >
                  {displayContent}
                </pre>
                {isLongContent && (
                  <button
                    onClick={() => toggleExpanded(log.id)}
                    className="mt-1 text-terminal-accent text-xs flex items-center gap-1 hover:text-terminal-fg"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={12} />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} />
                        Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            </React.Fragment>
          )
        })}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}
