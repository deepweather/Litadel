import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '../components/ui/Button'

export const BacktestList: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: backtests, isLoading } = useQuery({
    queryKey: ['backtests'],
    queryFn: () => api.getBacktests(),
  })

  const deleteBacktestMutation = useMutation({
    mutationFn: (id: number) => api.deleteBacktest(id),
    onSuccess: () => {
      toast.success('Backtest deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['backtests'] })
    },
    onError: (error: any) => {
      toast.error(error.detail || 'Failed to delete backtest')
    },
  })

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteBacktestMutation.mutate(id)
    }
  }

  const filteredBacktests = backtests?.filter((bt) => {
    if (statusFilter && bt.status !== statusFilter) return false
    return true
  })

  const formatPercentage = (value: number | null) => {
    if (value === null) return 'N/A'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00ff00'
      case 'running':
        return '#4da6ff'
      case 'failed':
        return '#ff0000'
      default:
        return '#2a3e4a'
    }
  }

  const getReturnColor = (value: number | null) => {
    if (value === null) return '#2a3e4a'
    return value >= 0 ? '#00ff00' : '#ff0000'
  }

  if (isLoading) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#2a3e4a',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Loading backtests...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '0.5rem',
            }}
          >
            BACKTESTS
          </h1>
          <p
            style={{
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
            }}
          >
            Manage and analyze your trading strategy backtests
          </p>
        </div>
        <Button onClick={() => navigate('/backtests/create')}>
          <Plus size={18} />
          <span>CREATE BACKTEST</span>
        </Button>
      </div>

      {/* Filters */}
      <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label
            style={{
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
            }}
          >
            STATUS:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              backgroundColor: '#1a2a3a',
              border: '1px solid #4da6ff',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {!filteredBacktests || filteredBacktests.length === 0 ? (
        <div
          style={{
            border: '1px solid rgba(77, 166, 255, 0.3)',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1rem',
              marginBottom: '1rem',
            }}
          >
            No backtests found
          </p>
          <Button onClick={() => navigate('/backtests/create')}>
            <Plus size={18} />
            <span>CREATE YOUR FIRST BACKTEST</span>
          </Button>
        </div>
      ) : (
        <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(77, 166, 255, 0.3)' }}>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  NAME
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  DATE RANGE
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  STATUS
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'right',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  RETURN
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'right',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  SHARPE
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'right',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  MAX DD
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'right',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  TRADES
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBacktests.map((backtest) => (
                <tr
                  key={backtest.id}
                  style={{
                    borderBottom: '1px solid rgba(77, 166, 255, 0.1)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  onClick={() => navigate(`/backtests/${backtest.id}`)}
                >
                  <td
                    style={{
                      padding: '1rem',
                      color: '#fff',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {backtest.name}
                    </div>
                    {backtest.description && (
                      <div style={{ color: '#2a3e4a', fontSize: '0.75rem' }}>
                        {backtest.description.substring(0, 50)}
                        {backtest.description.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      color: '#2a3e4a',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    {formatDate(backtest.start_date)} - {formatDate(backtest.end_date)}
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        border: `1px solid ${getStatusColor(backtest.status)}`,
                        color: getStatusColor(backtest.status),
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {backtest.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: getReturnColor(backtest.total_return_pct),
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {formatPercentage(backtest.total_return_pct)}
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#fff',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    {backtest.sharpe_ratio !== null ? backtest.sharpe_ratio.toFixed(2) : 'N/A'}
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#ff0000',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    {formatPercentage(backtest.max_drawdown_pct)}
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      textAlign: 'right',
                      color: '#2a3e4a',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    {backtest.total_trades !== null ? backtest.total_trades : 'N/A'}
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleDelete(backtest.id, backtest.name)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #ff0000',
                        backgroundColor: 'transparent',
                        color: '#ff0000',
                        cursor: 'pointer',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                      title="Delete Backtest"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
