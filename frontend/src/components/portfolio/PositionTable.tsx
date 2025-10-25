import React from 'react'
import { Edit, Trash2, XCircle } from 'lucide-react'
import type { Position } from '../../types/portfolio'

interface PositionTableProps {
  positions: Position[]
  onEdit: (position: Position) => void
  onDelete: (positionId: number) => void
  onClose: (position: Position) => void
}

export const PositionTable: React.FC<PositionTableProps> = ({
  positions,
  onEdit,
  onDelete,
  onClose,
}) => {
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const getPnLColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '#2a3e4a'
    return value >= 0 ? '#00ff00' : '#ff0000'
  }

  if (positions.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#2a3e4a',
          fontFamily: 'JetBrains Mono, monospace',
          border: '1px solid rgba(77, 166, 255, 0.3)',
        }}
      >
        No positions in this portfolio
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #4da6ff' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4da6ff' }}>TICKER</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4da6ff' }}>ASSET</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4da6ff' }}>QTY</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4da6ff' }}>ENTRY</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4da6ff' }}>CURRENT</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4da6ff' }}>P&L</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4da6ff' }}>P&L %</th>
            <th style={{ padding: '0.75rem', textAlign: 'center', color: '#4da6ff' }}>STATUS</th>
            <th style={{ padding: '0.75rem', textAlign: 'center', color: '#4da6ff' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr
              key={position.id}
              style={{
                borderBottom: '1px solid rgba(77, 166, 255, 0.2)',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <td style={{ padding: '0.75rem', color: '#4da6ff', fontWeight: 'bold' }}>
                {position.ticker}
              </td>
              <td style={{ padding: '0.75rem', color: '#2a3e4a' }}>
                {position.asset_class.toUpperCase()}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#fff' }}>
                {position.quantity.toFixed(4)}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#fff' }}>
                {formatCurrency(position.entry_price)}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#fff' }}>
                {position.status === 'open'
                  ? formatCurrency(position.current_price)
                  : formatCurrency(position.exit_price)}
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: getPnLColor(
                    position.status === 'open' ? position.unrealized_pnl : position.realized_pnl
                  ),
                }}
              >
                {position.status === 'open'
                  ? formatCurrency(position.unrealized_pnl)
                  : formatCurrency(position.realized_pnl)}
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: getPnLColor(position.pnl_percentage),
                }}
              >
                {formatPercentage(position.pnl_percentage)}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                <span
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    border: `1px solid ${position.status === 'open' ? '#00ff00' : '#2a3e4a'}`,
                    color: position.status === 'open' ? '#00ff00' : '#2a3e4a',
                  }}
                >
                  {position.status.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => onEdit(position)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4da6ff',
                      cursor: 'pointer',
                      padding: '0.25rem',
                    }}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  {position.status === 'open' && (
                    <button
                      onClick={() => onClose(position)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffaa00',
                        cursor: 'pointer',
                        padding: '0.25rem',
                      }}
                      title="Close Position"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(position.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff0000',
                      cursor: 'pointer',
                      padding: '0.25rem',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

