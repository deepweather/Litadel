import React from 'react'

interface MarketMetric {
  label: string
  value: string | number
}

interface MarketMetricsGridProps {
  metrics: MarketMetric[]
  className?: string
}

export const MarketMetricsGrid: React.FC<MarketMetricsGridProps> = ({
  metrics,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-4 gap-base pb-base mb-base border-b border-border ${className}`.trim()}>
      {metrics.map((metric, index) => (
        <div key={index}>
          <div className="text-xs text-subdued font-mono">
            {metric.label}
          </div>
          <div className="text-base text-primary font-bold font-mono">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  )
}

