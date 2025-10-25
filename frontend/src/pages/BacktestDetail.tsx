import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, ChevronDown, ChevronUp, Play, XCircle } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '../components/ui/Button'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useBacktestWebSocket } from '../hooks/useBacktestWebSocket'

export const BacktestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showStrategy, setShowStrategy] = useState(false)
  const backtestId = parseInt(id || '0', 10)
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)

  // Use WebSocket for real-time status updates
  const { status: wsStatus } = useBacktestWebSocket(backtestId)

  const { data: backtest, isLoading: loadingBacktest } = useQuery({
    queryKey: ['backtest', backtestId],
    queryFn: () => api.getBacktest(backtestId),
    enabled: backtestId > 0,
  })

  // Watch for WebSocket status updates
  useEffect(() => {
    if (wsStatus) {
      // Update the query cache with WebSocket data
      queryClient.setQueryData(['backtest', backtestId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          status: wsStatus.status,
          progress_percentage: wsStatus.progress_percentage,
        }
      })

      // When backtest completes, invalidate all related queries to fetch full results
      if (wsStatus.status === 'completed' && previousStatus === 'running') {
        queryClient.invalidateQueries({ queryKey: ['backtest', backtestId] })
        queryClient.invalidateQueries({ queryKey: ['backtest-trades', backtestId] })
        queryClient.invalidateQueries({ queryKey: ['backtest-equity-curve', backtestId] })
        toast.success('Backtest completed successfully!')
      }

      setPreviousStatus(wsStatus.status)
    }
  }, [wsStatus, previousStatus, backtestId, queryClient])

  const executeBacktestMutation = useMutation({
    mutationFn: (id: number) => api.executeBacktest(id),
    onSuccess: () => {
      toast.success('Backtest execution started')
      queryClient.invalidateQueries({ queryKey: ['backtest', backtestId] })
    },
    onError: (error: any) => {
      toast.error(error.detail || 'Failed to execute backtest')
    },
  })

  const cancelBacktestMutation = useMutation({
    mutationFn: (id: number) => api.cancelBacktest(id),
    onSuccess: () => {
      toast.success('Backtest cancelled')
      queryClient.invalidateQueries({ queryKey: ['backtest', backtestId] })
    },
    onError: (error: any) => {
      toast.error(error.detail || 'Failed to cancel backtest')
    },
  })

  const { data: trades } = useQuery({
    queryKey: ['backtest-trades', backtestId],
    queryFn: () => api.getBacktestTrades(backtestId),
    enabled: backtestId > 0 && backtest?.status === 'completed',
  })

  const { data: equityCurve } = useQuery({
    queryKey: ['backtest-equity-curve', backtestId],
    queryFn: () => api.getBacktestEquityCurve(backtestId),
    enabled: backtestId > 0 && backtest?.status === 'completed',
  })

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
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

  if (loadingBacktest) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#2a3e4a',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Loading backtest...
      </div>
    )
  }

  if (!backtest) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#ff0000',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Backtest not found
      </div>
    )
  }

  const returnColor = backtest.total_return_pct !== null && backtest.total_return_pct >= 0 ? '#00ff00' : '#ff0000'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <Button onClick={() => navigate('/backtests')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </Button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {backtest.name}
            </h1>
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
            {backtest.status === 'running' && (
              <span
                style={{
                  color: '#2a3e4a',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.875rem',
                }}
              >
                Progress: {backtest.progress_percentage}%
              </span>
            )}
          </div>
          {backtest.description && (
            <p
              style={{
                color: '#2a3e4a',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
              }}
            >
              {backtest.description}
            </p>
          )}
          <p
            style={{
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
              marginTop: '0.5rem',
            }}
          >
            {formatDate(backtest.start_date)} - {formatDate(backtest.end_date)} | Initial Capital: {formatCurrency(backtest.initial_capital)}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      {backtest.status === 'completed' && (
        <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)', padding: '1.5rem' }}>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '1.5rem',
            }}
          >
            PERFORMANCE SUMMARY
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' }}>
            <div>
              <div style={{ color: '#2a3e4a', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                TOTAL RETURN
              </div>
              <div
                style={{
                  color: returnColor,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {formatPercentage(backtest.total_return_pct)}
              </div>
            </div>
            <div>
              <div style={{ color: '#2a3e4a', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                SHARPE RATIO
              </div>
              <div
                style={{
                  color: '#4da6ff',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {backtest.sharpe_ratio !== null ? backtest.sharpe_ratio.toFixed(2) : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ color: '#2a3e4a', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                MAX DRAWDOWN
              </div>
              <div
                style={{
                  color: '#ff0000',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {formatPercentage(backtest.max_drawdown_pct)}
              </div>
            </div>
            <div>
              <div style={{ color: '#2a3e4a', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                WIN RATE
              </div>
              <div
                style={{
                  color: '#00ff00',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {formatPercentage(backtest.win_rate)}
              </div>
            </div>
            <div>
              <div style={{ color: '#2a3e4a', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                TOTAL TRADES
              </div>
              <div
                style={{
                  color: '#4da6ff',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {backtest.total_trades !== null ? backtest.total_trades : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equity Curve */}
      {equityCurve && equityCurve.length > 0 && (
        <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)', padding: '1.5rem' }}>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '1.5rem',
            }}
          >
            EQUITY CURVE
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(77, 166, 255, 0.1)" />
              <XAxis
                dataKey="date"
                stroke="#2a3e4a"
                style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              />
              <YAxis
                stroke="#2a3e4a"
                style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a1929',
                  border: '1px solid #4da6ff',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.75rem',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
              />
              <Line type="monotone" dataKey="portfolio_value" stroke="#4da6ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trades Table */}
      {trades && trades.length > 0 && (
        <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(77, 166, 255, 0.3)' }}>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              TRADES
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
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
                    DATE
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
                    TICKER
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
                    ACTION
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
                    QUANTITY
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
                    PRICE
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
                    P&L
                  </th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 50).map((trade) => (
                  <tr
                    key={trade.id}
                    style={{ borderBottom: '1px solid rgba(77, 166, 255, 0.1)' }}
                  >
                    <td
                      style={{
                        padding: '1rem',
                        color: '#2a3e4a',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.875rem',
                      }}
                    >
                      {formatDate(trade.trade_date)}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        color: '#fff',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {trade.ticker}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          border: `1px solid ${trade.action === 'BUY' ? '#00ff00' : '#ff0000'}`,
                          color: trade.action === 'BUY' ? '#00ff00' : '#ff0000',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem',
                        }}
                      >
                        {trade.action}
                      </span>
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
                      {trade.quantity.toFixed(2)}
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
                      {formatCurrency(trade.price)}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        color: trade.pnl !== null && trade.pnl >= 0 ? '#00ff00' : '#ff0000',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {trade.pnl !== null ? (
                        <>
                          {formatCurrency(trade.pnl)} ({formatPercentage(trade.pnl_pct)})
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {trades.length > 50 && (
            <div
              style={{
                padding: '1rem',
                textAlign: 'center',
                color: '#2a3e4a',
                fontSize: '0.875rem',
              }}
            >
              Showing first 50 of {trades.length} trades
            </div>
          )}
        </div>
      )}

      {/* Strategy Section */}
      <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)' }}>
        <button
          onClick={() => setShowStrategy(!showStrategy)}
          style={{
            width: '100%',
            padding: '1.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            STRATEGY DEFINITION
          </h2>
          {showStrategy ? <ChevronUp color="#4da6ff" /> : <ChevronDown color="#4da6ff" />}
        </button>
        {showStrategy && (
          <div
            style={{
              padding: '1.5rem',
              borderTop: '1px solid rgba(77, 166, 255, 0.3)',
            }}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  color: '#2a3e4a',
                  fontSize: '0.75rem',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                }}
              >
                NATURAL LANGUAGE DESCRIPTION
              </div>
              <div
                style={{
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: '1.5',
                }}
              >
                {backtest.strategy_description}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: '#2a3e4a',
                  fontSize: '0.75rem',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                }}
              >
                DSL YAML
              </div>
              <pre
                style={{
                  backgroundColor: '#1a2a3a',
                  border: '1px solid rgba(77, 166, 255, 0.3)',
                  padding: '1rem',
                  overflow: 'auto',
                  color: '#4da6ff',
                  fontSize: '0.75rem',
                  fontFamily: 'Consolas, Monaco, monospace',
                  lineHeight: '1.5',
                }}
              >
                {backtest.strategy_dsl_yaml}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Pending State - Show Execute Button */}
      {backtest.status === 'pending' && (
        <div
          style={{
            border: '1px solid rgba(77, 166, 255, 0.3)',
            padding: '2rem',
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
            Backtest is pending execution. Click the button below to start.
          </p>
          <Button
            onClick={() => executeBacktestMutation.mutate(backtestId)}
            disabled={executeBacktestMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
          >
            <Play size={18} />
            <span>{executeBacktestMutation.isPending ? 'STARTING...' : 'EXECUTE BACKTEST'}</span>
          </Button>
        </div>
      )}

      {/* Running State - Show Progress */}
      {backtest.status === 'running' && (
        <div
          style={{
            border: '1px solid rgba(77, 166, 255, 0.3)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1rem',
              marginBottom: '1rem',
            }}
          >
            Backtest is running... Progress: {backtest.progress_percentage}%
          </p>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(77, 166, 255, 0.2)',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: `${backtest.progress_percentage}%`,
              height: '100%',
              backgroundColor: '#4da6ff',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <Button
            onClick={() => cancelBacktestMutation.mutate(backtestId)}
            disabled={cancelBacktestMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', borderColor: '#ff0000', color: '#ff0000' }}
          >
            <XCircle size={18} />
            <span>{cancelBacktestMutation.isPending ? 'CANCELLING...' : 'CANCEL BACKTEST'}</span>
          </Button>
        </div>
      )}

      {/* Failed State */}
      {backtest.status === 'failed' && (
        <div
          style={{
            border: '1px solid #ff0000',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#ff0000',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1rem',
            }}
          >
            Backtest execution failed. Please check the logs or try again.
          </p>
        </div>
      )}
    </div>
  )
}

