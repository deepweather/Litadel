import React from 'react'

interface TableCellProps {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
  color?: string
  bold?: boolean
  header?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  align = 'left',
  color,
  bold = false,
  header = false,
  onClick,
  className = '',
}) => {
  const Component = header ? 'th' : 'td'

  return (
    <Component
      className={className}
      style={{
        padding: '1rem',
        textAlign: align,
        color: color || (header ? '#4da6ff' : '#fff'),
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: header ? '0.75rem' : '0.875rem',
        fontWeight: bold || header ? 'bold' : 'normal',
      }}
      onClick={onClick}
    >
      {children}
    </Component>
  )
}

