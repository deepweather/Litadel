import React, { useState } from 'react'

interface TableRowProps {
  children: React.ReactNode
  onClick?: () => void
  hoverable?: boolean
  className?: string
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  onClick,
  hoverable = true,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <tr
      className={className}
      style={{
        borderBottom: '1px solid rgba(77, 166, 255, 0.1)',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: isHovered && hoverable ? 'rgba(77, 166, 255, 0.05)' : 'transparent',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={() => hoverable && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

