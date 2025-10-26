import React from 'react'

interface TableHeaderProps {
  children: React.ReactNode
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children }) => {
  return (
    <thead>
      <tr style={{ borderBottom: '1px solid rgba(77, 166, 255, 0.3)' }}>
        {children}
      </tr>
    </thead>
  )
}

