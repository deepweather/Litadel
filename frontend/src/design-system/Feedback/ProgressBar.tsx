import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  height?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger'
}

const heightClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-4',
}

const colorClasses = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
  height = 'md',
  color = 'primary',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full bg-bg-secondary ${heightClasses[height]} ${className}`.trim()}>
      <div
        className={`${heightClasses[height]} ${colorClasses[color]} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

