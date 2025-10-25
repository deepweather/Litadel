import React, { useEffect, useState } from 'react'
import { useAnalysisStore } from '../../stores/analysisStore'
import { Wifi } from 'lucide-react'

export const StatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date())
  const activeAnalyses = useAnalysisStore((state) => state.activeAnalyses)
  const runningCount = Array.from(activeAnalyses.values()).filter(
    (a) => a.status === 'running'
  ).length

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(77, 166, 255, 0.3)',
        backgroundColor: '#0a0e14',
        padding: '0.5rem 1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wifi size={14} style={{ color: '#4da6ff' }} />
            <span style={{ color: '#4da6ff' }}>Connected</span>
          </div>
          <div style={{ color: '#2a3e4a' }}>
            Active Analyses: <span style={{ color: '#00d4ff' }}>{runningCount}</span>
          </div>
          <div style={{ color: '#2a3e4a' }}>
            Total: <span style={{ color: '#4da6ff' }}>{activeAnalyses.size}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ color: '#00d4ff' }}>{timeString}</div>
          <div style={{ color: '#2a3e4a' }}>
            Ready{' '}
            <span className="terminal-blink" style={{ color: '#4da6ff' }}>
              ▮
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
