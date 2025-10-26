import React from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { getDecisionColor } from '../../design-system/theme'

interface DecisionBadgeProps {
  decision: 'BUY' | 'SELL' | 'HOLD'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { icon: 16, text: 'text-md' },
  md: { icon: 20, text: 'text-lg' },
  lg: { icon: 32, text: 'text-3xl' },
}

export const DecisionBadge: React.FC<DecisionBadgeProps> = ({
  decision,
  size = 'md',
  className = '',
}) => {
  const color = getDecisionColor(decision)
  const { icon: iconSize, text: textSize } = sizeMap[size]

  const Icon = decision === 'BUY' ? TrendingUp : decision === 'SELL' ? TrendingDown : Minus

  return (
    <div className={`flex items-center gap-sm ${className}`.trim()}>
      <Icon size={iconSize} style={{ color }} />
      <span className={`${textSize} font-bold font-mono`} style={{ color }}>
        {decision}
      </span>
    </div>
  )
}

