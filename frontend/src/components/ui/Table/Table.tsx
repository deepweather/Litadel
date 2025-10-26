import React from 'react'

interface TableProps {
  children: React.ReactNode
  bordered?: boolean
  className?: string
}

export const Table: React.FC<TableProps> = ({
  children,
  bordered = true,
  className = '',
}) => {
  return (
    <div
      className={className}
      style={{
        overflowX: 'auto',
        border: bordered ? '1px solid rgba(77, 166, 255, 0.3)' : 'none',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {children}
      </table>
    </div>
  )
}

