import React from 'react'
import type { AgentName } from '../../types/analysis'
import { getStatusIcon } from '../../utils/ascii'
import { getStatusColor } from '../../utils/formatters'

interface AgentStatusCardProps {
  name: AgentName
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ name, status }) => {
  const icon = getStatusIcon(status)
  const colorClass = getStatusColor(status)

  const statusText = status.toUpperCase()
  const showBlink = status === 'running'

  return (
    <div className={`flex items-center justify-between py-1 px-2 ${colorClass}`}>
      <div className="flex items-center gap-2">
        <span className="font-mono">{icon}</span>
        <span className="font-mono text-sm">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-mono ${showBlink ? 'terminal-blink' : ''}`}>
          [{statusText}]
        </span>
      </div>
    </div>
  )
}
