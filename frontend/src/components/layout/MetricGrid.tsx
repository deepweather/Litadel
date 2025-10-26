import React from 'react'

interface MetricGridProps {
  children: React.ReactNode
  columns?: number
  gap?: 'sm' | 'md' | 'lg'
}

export const MetricGrid: React.FC<MetricGridProps> = ({
  children,
  columns,
  gap = 'md',
}) => {
  const gapMap = {
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: gapMap[gap],
    ...(columns
      ? {
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }
      : {
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }),
  }

  return <div style={gridStyle}>{children}</div>
}

