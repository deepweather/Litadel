import React from 'react'

interface Column {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: any) => React.ReactNode
}

interface ASCIITableProps {
  columns: Column[]
  data: any[]
  onRowClick?: (row: any, index: number) => void
  className?: string
}

export const ASCIITable: React.FC<ASCIITableProps> = ({
  columns,
  data,
  onRowClick,
  className = '',
}) => {
  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse font-mono text-sm">
        <thead>
          <tr className="border-b border-terminal-border">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-2 text-terminal-fg font-bold ${getAlignClass(column.align)}`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-terminal-dim">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  border-b border-terminal-border
                  hover:bg-terminal-highlight
                  ${onRowClick ? 'cursor-pointer' : ''}
                  transition-colors
                `}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-2 text-terminal-fg ${getAlignClass(column.align)}`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
