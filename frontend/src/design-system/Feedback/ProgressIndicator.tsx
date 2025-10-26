import React from 'react'
import { ProgressBar } from './ProgressBar'
import { Text } from '../Typography/Text'

interface ProgressIndicatorProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger'
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  className = '',
  color = 'primary',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between mb-sm">
          {label && (
            <Text size="xs" variant="subdued" as="span">
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text size="xs" variant={color as any} as="span">
              {Math.round(percentage)}%
            </Text>
          )}
        </div>
      )}
      <ProgressBar value={value} max={max} color={color} />
    </div>
  )
}

