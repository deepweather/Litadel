import React from 'react'

interface ProgressBarProps {
  percentage: number
  showPercentage?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  showPercentage = true,
  className = '',
}) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage))
  const filled = Math.round((clampedPercentage / 100) * 20)
  const empty = 20 - filled

  return (
    <div className={`flex items-center gap-2 font-mono ${className}`}>
      <div className="flex-1 text-terminal-fg">
        <span className="text-terminal-fg">{'['}</span>
        <span className="text-terminal-fg">{'█'.repeat(filled)}</span>
        <span className="text-terminal-dim">{'░'.repeat(empty)}</span>
        <span className="text-terminal-fg">{']'}</span>
      </div>
      {showPercentage && (
        <span className="text-terminal-fg min-w-[3rem] text-right">
          {clampedPercentage.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
