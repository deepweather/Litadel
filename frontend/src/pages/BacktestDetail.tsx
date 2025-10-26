import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Play, XCircle } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MetricCard } from '../components/common/MetricCard'
import { StatusBadge } from '../components/data-display/StatusBadge'
import { Collapsible } from '../components/interactive/Collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useBacktestWebSocket } from '../hooks/useBacktestWebSocket'
import { formatCurrency, formatDateShort, formatPercentageWithSign } from '../utils/formatters'
import { StrategyCodeVisualizer } from '../components/backtest/StrategyCodeVisualizer'

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
      <div className="p-8 text-center text-muted-foreground font-mono">
        Loading backtest...
      </div>
    )
  }

  if (!backtest) {
    return (
      <div className="p-8 text-center text-destructive font-mono">
        Backtest not found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button onClick={() => navigate('/backtests')} size="icon">
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold text-primary font-mono">
              {backtest.name}
            </h1>
            <StatusBadge status={backtest.status as 'pending' | 'running' | 'completed' | 'failed'} />
            {backtest.status === 'running' && (
              <span className="text-muted-foreground font-mono text-sm">
                Progress: {backtest.progress_percentage}%
              </span>
            )}
          </div>
          {backtest.description && (
            <p className="text-muted-foreground font-mono text-sm">
              {backtest.description}
            </p>
          )}
          <p className="text-muted-foreground font-mono text-sm mt-2">
            {formatDateShort(backtest.start_date)} - {formatDateShort(backtest.end_date)} | Initial Capital: {formatCurrency(backtest.initial_capital)}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      {backtest.status === 'completed' && (
        <Card className="p-6">
          <h2 className="text-base font-bold text-primary font-mono mb-6">
            PERFORMANCE SUMMARY
          </h2>
          <div className="grid grid-cols-5 gap-6">
            <MetricCard
              label="TOTAL RETURN"
              value={formatPercentageWithSign(backtest.total_return_pct)}
            />
            <MetricCard
              label="SHARPE RATIO"
              value={backtest.sharpe_ratio !== null ? backtest.sharpe_ratio.toFixed(2) : 'N/A'}
            />
            <MetricCard
              label="MAX DRAWDOWN"
              value={formatPercentageWithSign(backtest.max_drawdown_pct)}
            />
            <MetricCard
              label="WIN RATE"
              value={formatPercentageWithSign(backtest.win_rate)}
            />
            <MetricCard
              label="TOTAL TRADES"
              value={backtest.total_trades !== null ? backtest.total_trades : 'N/A'}
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
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-bold text-primary font-mono">
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
            <div className="p-4 text-center text-muted-foreground text-sm">
              Showing first 50 of {trades.length} trades
            </div>
          )}
        </Card>
      )}

      {/* Strategy Section */}
      <Collapsible title="STRATEGY DEFINITION" defaultExpanded={false}>
        <div className="mb-6">
          <div className="text-muted-foreground text-xs mb-2 font-bold">
            NATURAL LANGUAGE DESCRIPTION
          </div>
          <div className="text-foreground text-sm font-mono leading-relaxed">
            {backtest.strategy_description}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs mb-2 font-bold">
            PYTHON STRATEGY CODE
          </div>
          <StrategyCodeVisualizer
            codeContent={backtest.strategy_code_python}
            strategyType={backtest.strategy_type}
          />
        </div>
      </Collapsible>

      {/* Pending State - Show Execute Button */}
      {backtest.status === 'pending' && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground font-mono text-base mb-4">
              Backtest is pending execution. Click the button below to start.
            </p>
            <Button
              onClick={() => executeBacktestMutation.mutate(backtestId)}
              disabled={executeBacktestMutation.isPending}
              className="flex items-center gap-2"
            >
              <Play size={18} />
              <span>{executeBacktestMutation.isPending ? 'STARTING...' : 'EXECUTE BACKTEST'}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Running State - Show Progress */}
      {backtest.status === 'running' && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-primary font-mono text-base mb-4">
              Backtest is running... Progress: {backtest.progress_percentage}%
            </p>
            <div className="w-full h-1 bg-primary/20 mb-4">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${backtest.progress_percentage}%` }}
              />
            </div>
            <Button
              onClick={() => cancelBacktestMutation.mutate(backtestId)}
              disabled={cancelBacktestMutation.isPending}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <XCircle size={18} />
              <span>{cancelBacktestMutation.isPending ? 'CANCELLING...' : 'CANCEL BACKTEST'}</span>
            </Button>
          </CardContent>
        </Card>
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

