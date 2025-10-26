import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Play, XCircle } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MetricCard } from '../components/common/MetricCard'
import { StatusBadge } from '../components/data-display/StatusBadge'
import { Collapsible } from '../components/interactive/Collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useBacktestWebSocket } from '../hooks/useBacktestWebSocket'
import { formatCurrency, formatDateShort, formatPercentageWithSign } from '../utils/formatters'
import { getPnLColor, themeColors } from '../utils/colors'

export const BacktestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
              className="text-2xl font-bold text-primary font-mono"
            >
              {backtest.name}
            </h1>
            <StatusBadge status={backtest.status as 'pending' | 'running' | 'completed' | 'failed'} />
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
            {formatDateShort(backtest.start_date)} - {formatDateShort(backtest.end_date)} | Initial Capital: {formatCurrency(backtest.initial_capital)}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      {backtest.status === 'completed' && (
        <Card className="p-6">
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: themeColors.primary,
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '1.5rem',
            }}
          >
            PERFORMANCE SUMMARY
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' }}>
            <MetricCard
              label="TOTAL RETURN"
              value={formatPercentageWithSign(backtest.total_return_pct)}
              color={getPnLColor(backtest.total_return_pct)}
            />
            <MetricCard
              label="SHARPE RATIO"
              value={backtest.sharpe_ratio !== null ? backtest.sharpe_ratio.toFixed(2) : 'N/A'}
              color={themeColors.primary}
            />
            <MetricCard
              label="MAX DRAWDOWN"
              value={formatPercentageWithSign(backtest.max_drawdown_pct)}
              color={themeColors.error}
            />
            <MetricCard
              label="WIN RATE"
              value={formatPercentageWithSign(backtest.win_rate)}
              color={themeColors.success}
            />
            <MetricCard
              label="TOTAL TRADES"
              value={backtest.total_trades !== null ? backtest.total_trades : 'N/A'}
              color={themeColors.primary}
            />
          </div>
        </Card>
      )}

      {/* Equity Curve */}
      {equityCurve && equityCurve.length > 0 && (
        <Card className="p-6">
          <h2
            className="text-base font-bold text-primary font-mono mb-6"
          >
            EQUITY CURVE
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.1)" />
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
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--primary))',
                fontFamily: 'JetBrains Mono',
                fontSize: '0.75rem',
              }}
                labelFormatter={(value) => formatDateShort(value)}
                formatter={(value: any) => [formatCurrency(value), 'Portfolio Value']}
              />
              <Line type="monotone" dataKey="portfolio_value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Trades Table */}
      {trades && trades.length > 0 && (
        <Card className="p-3">
          <div style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <h2
              className="text-base font-bold text-primary font-mono"
            >
              TRADES
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DATE</TableHead>
                <TableHead>TICKER</TableHead>
                <TableHead className="text-center">ACTION</TableHead>
                <TableHead className="text-right">QUANTITY</TableHead>
                <TableHead className="text-right">PRICE</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.slice(0, 50).map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="text-muted-foreground">{formatDateShort(trade.trade_date)}</TableCell>
                  <TableCell className="font-bold">{trade.ticker}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 border font-mono text-xs ${
                        trade.action === 'BUY'
                          ? 'border-green-500 text-green-600 dark:text-green-400'
                          : 'border-red-500 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {trade.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{trade.quantity.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(trade.price)}</TableCell>
                  <TableCell
                    className={`text-right font-bold ${
                      trade.pnl !== null && trade.pnl >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {trade.pnl !== null ? (
                      <>
                        {formatCurrency(trade.pnl)} ({formatPercentageWithSign(trade.pnl_pct)})
                      </>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        </Card>
      )}

      {/* Strategy Section */}
      <Collapsible title="STRATEGY DEFINITION" defaultExpanded={false}>
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
            className="bg-secondary border border-primary/30 p-4 overflow-auto text-primary text-xs font-mono"
            style={{
              lineHeight: '1.5',
            }}
          >
            {backtest.strategy_dsl_yaml}
          </pre>
        </div>
      </Collapsible>

      {/* Pending State - Show Execute Button */}
      {backtest.status === 'pending' && (
        <div
          style={{
            border: '1px solid hsl(var(--border))',
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
            border: '1px solid hsl(var(--border))',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p
            className="text-primary font-mono text-base"
            style={{
              marginBottom: '1rem',
            }}
          >
            Backtest is running... Progress: {backtest.progress_percentage}%
          </p>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'hsl(var(--primary) / 0.2)',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: `${backtest.progress_percentage}%`,
              height: '100%',
              backgroundColor: 'hsl(var(--primary))',
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

