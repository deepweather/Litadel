import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, BarChart3, Code, List, Play, TrendingUp, XCircle } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard } from '../components/common/MetricCard'
import { StatusBadge } from '../components/data-display/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useBacktestWebSocket } from '../hooks/useBacktestWebSocket'
import { formatCurrency, formatDateShort, formatPercentageWithSign } from '../utils/formatters'
import { StrategyCodeVisualizer } from '../components/backtest/StrategyCodeVisualizer'
import { EquityCurveChart } from '../components/backtest/EquityCurveChart'
import { DrawdownChart } from '../components/backtest/DrawdownChart'
import { CumulativePnLChart } from '../components/backtest/CumulativePnLChart'

export const BacktestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const backtestId = parseInt(id || '0', 10)
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)

  const { status: wsStatus } = useBacktestWebSocket(backtestId)

  const { data: backtest, isLoading: loadingBacktest } = useQuery({
    queryKey: ['backtest', backtestId],
    queryFn: () => api.getBacktest(backtestId),
    enabled: backtestId > 0,
    // No polling - WebSocket handles real-time updates
  })

  useEffect(() => {
    if (wsStatus) {
      console.log('[BacktestDetail] WebSocket update:', wsStatus.status, 'Previous:', previousStatus)

      queryClient.setQueryData(['backtest', backtestId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          status: wsStatus.status,
          progress_percentage: wsStatus.progress_percentage,
        }
      })

      // Refetch backtest data when status changes
      if (wsStatus.status === 'pending' && previousStatus === 'validating') {
        console.log('[BacktestDetail] Validation complete, refetching backtest...')
        queryClient.invalidateQueries({ queryKey: ['backtest', backtestId] })
        toast.success('✅ Strategy validated!')
      }

      // Refetch ALL data when backtest execution completes
      if (wsStatus.status === 'completed' && previousStatus === 'running') {
        console.log('[BacktestDetail] Backtest complete, refetching all data...')
        queryClient.invalidateQueries({ queryKey: ['backtest', backtestId] })
        queryClient.invalidateQueries({ queryKey: ['backtest-trades', backtestId] })
        queryClient.invalidateQueries({ queryKey: ['backtest-equity-curve', backtestId] })
        queryClient.invalidateQueries({ queryKey: ['backtest-performance', backtestId] })
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

  const { data: trades, refetch: refetchTrades } = useQuery({
    queryKey: ['backtest-trades', backtestId],
    queryFn: () => api.getBacktestTrades(backtestId),
    enabled: backtestId > 0 && backtest?.status === 'completed',
  })

  const { data: equityCurve, refetch: refetchEquityCurve } = useQuery({
    queryKey: ['backtest-equity-curve', backtestId],
    queryFn: () => api.getBacktestEquityCurve(backtestId),
    enabled: backtestId > 0 && backtest?.status === 'completed',
  })

  const { data: performance } = useQuery({
    queryKey: ['backtest-performance', backtestId],
    queryFn: () => api.getBacktestPerformance(backtestId),
    enabled: backtestId > 0 && backtest?.status === 'completed',
  })

  useEffect(() => {
    if (backtest?.status === 'completed') {
      refetchTrades()
      refetchEquityCurve()
    }
  }, [backtest?.status, refetchTrades, refetchEquityCurve])

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
          </div>
          {backtest.description && (
            <p className="text-muted-foreground font-mono text-sm">
              {backtest.description}
            </p>
          )}
          <p className="text-muted-foreground font-mono text-sm mt-2">
            {backtest.ticker_list.join(', ')} | {formatDateShort(backtest.start_date)} - {formatDateShort(backtest.end_date)} | {formatCurrency(backtest.initial_capital)}
          </p>
        </div>
      </div>

      {/* Validating State */}
      {backtest.status === 'validating' && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-primary font-mono text-base font-bold">
              Validating strategy...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending State */}
      {backtest.status === 'pending' && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground font-mono text-base mb-4">
              ✅ Code validated - Ready to execute
            </p>
            <Button
              onClick={() => executeBacktestMutation.mutate(backtestId)}
              disabled={executeBacktestMutation.isPending}
              size="lg"
            >
              <Play size={18} />
              <span>{executeBacktestMutation.isPending ? 'STARTING...' : 'EXECUTE BACKTEST'}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Running State */}
      {backtest.status === 'running' && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-primary font-mono text-base font-bold">
                Running... {backtest.progress_percentage}%
              </p>
              <Button
                onClick={() => cancelBacktestMutation.mutate(backtestId)}
                disabled={cancelBacktestMutation.isPending}
                variant="destructive"
                size="sm"
              >
                <XCircle size={16} />
                <span>CANCEL</span>
              </Button>
            </div>
            <div className="w-full h-2 bg-primary/20 rounded-full">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${backtest.progress_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed State */}
      {backtest.status === 'failed' && (
        <Card className="border-red-500">
          <CardContent className="p-8 text-center">
            <p className="text-red-500 font-mono text-base font-bold mb-2">
              Execution Failed
            </p>
            <p className="text-muted-foreground font-mono text-sm">
              Check backend logs for details
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results - Tabbed Interface */}
      {backtest.status === 'completed' && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="font-mono text-sm">
              <TrendingUp size={16} className="mr-2" />
              OVERVIEW
            </TabsTrigger>
            <TabsTrigger value="performance" className="font-mono text-sm">
              <BarChart3 size={16} className="mr-2" />
              PERFORMANCE
            </TabsTrigger>
            <TabsTrigger value="trades" className="font-mono text-sm">
              <List size={16} className="mr-2" />
              TRADES
            </TabsTrigger>
            <TabsTrigger value="strategy" className="font-mono text-sm">
              <Code size={16} className="mr-2" />
              STRATEGY
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Key Info */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono text-primary">
                  KEY METRICS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
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
                </div>
              </CardContent>
            </Card>

            {/* Equity Curve - Main Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono text-primary flex items-center gap-2">
                  <TrendingUp size={16} />
                  EQUITY CURVE
                </CardTitle>
              </CardHeader>
              <CardContent>
                {equityCurve && equityCurve.length > 0 ? (
                  <EquityCurveChart
                    data={equityCurve}
                    height={400}
                    initialCapital={backtest.initial_capital}
                  />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground font-mono text-sm">
                    Loading chart data...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono text-primary">
                    CAPITAL
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-mono">Initial</span>
                    <span className="text-sm font-bold font-mono">{formatCurrency(backtest.initial_capital)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-mono">Final</span>
                    <span className="text-sm font-bold font-mono text-primary">{formatCurrency(backtest.final_portfolio_value)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground font-mono">Profit/Loss</span>
                    <span className={`text-sm font-bold font-mono ${
                      (backtest.total_return_pct || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatCurrency((backtest.final_portfolio_value || 0) - backtest.initial_capital)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono text-primary">
                    TRADING ACTIVITY
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-mono">Total Trades</span>
                    <span className="text-sm font-bold font-mono">{backtest.total_trades || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-mono">Win Rate</span>
                    <span className="text-sm font-bold font-mono">{formatPercentageWithSign(backtest.win_rate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-mono">Avg Duration</span>
                    <span className="text-sm font-bold font-mono">
                      {backtest.avg_trade_duration_days !== null ? `${backtest.avg_trade_duration_days.toFixed(1)}d` : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab - Detailed Analysis */}
          <TabsContent value="performance" className="space-y-6">
            {/* All Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono text-primary">
                  PERFORMANCE METRICS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  <MetricCard label="RETURN" value={formatPercentageWithSign(backtest.total_return_pct)} />
                  <MetricCard label="SHARPE" value={backtest.sharpe_ratio?.toFixed(2) || 'N/A'} />
                  <MetricCard label="MAX DD" value={formatPercentageWithSign(backtest.max_drawdown_pct)} />
                  <MetricCard label="WIN RATE" value={formatPercentageWithSign(backtest.win_rate)} />
                  <MetricCard label="TRADES" value={backtest.total_trades?.toString() || '0'} />
                  {performance && (
                    <>
                      <MetricCard label="PROFIT FACTOR" value={performance.profit_factor?.toFixed(2) || 'N/A'} />
                      <MetricCard label="AVG WIN" value={performance.avg_win ? formatCurrency(performance.avg_win) : 'N/A'} />
                      <MetricCard label="AVG LOSS" value={performance.avg_loss ? formatCurrency(performance.avg_loss) : 'N/A'} />
                      <MetricCard label="WINNERS" value={performance.win_count?.toString() || '0'} />
                      <MetricCard label="LOSERS" value={performance.loss_count?.toString() || '0'} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono text-primary">
                    DRAWDOWN
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {equityCurve && equityCurve.length > 0 ? (
                    <DrawdownChart data={equityCurve} height={280} />
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground font-mono text-sm">
                      No data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono text-primary">
                    CUMULATIVE P&L
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trades && trades.length > 0 ? (
                    <CumulativePnLChart trades={trades} height={280} />
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground font-mono text-sm">
                      No trades
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trades Tab - Transaction History */}
          <TabsContent value="trades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono text-primary">
                  TRADE HISTORY ({trades?.length || 0} trades)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {trades && trades.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DATE</TableHead>
                        <TableHead>TICKER</TableHead>
                        <TableHead className="text-center">ACTION</TableHead>
                        <TableHead className="text-right">QTY</TableHead>
                        <TableHead className="text-right">PRICE</TableHead>
                        <TableHead className="text-right">P&L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatDateShort(trade.trade_date)}
                          </TableCell>
                          <TableCell className="font-bold text-sm">{trade.ticker}</TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`px-2 py-0.5 border font-mono text-xs ${
                                trade.action === 'BUY'
                                  ? 'border-green-500 text-green-600 dark:text-green-400'
                                  : 'border-red-500 text-red-600 dark:text-red-400'
                              }`}
                            >
                              {trade.action}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm">{trade.quantity.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(trade.price)}</TableCell>
                          <TableCell
                            className={`text-right font-bold text-sm ${
                              trade.pnl !== null && trade.pnl >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {trade.pnl !== null ? (
                              <div className="flex flex-col items-end">
                                <span>{formatCurrency(trade.pnl)}</span>
                                <span className="text-xs opacity-70">
                                  {formatPercentageWithSign(trade.pnl_pct)}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-muted-foreground font-mono text-base mb-2">
                      No trades executed
                    </p>
                    <p className="text-xs text-dim">
                      The strategy didn't meet entry conditions during this period
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Tab - Code */}
          <TabsContent value="strategy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono text-primary">
                  STRATEGY DESCRIPTION
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground text-sm font-mono leading-relaxed whitespace-pre-wrap">
                  {backtest.strategy_description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono text-primary">
                  PYTHON CODE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StrategyCodeVisualizer
                  codeContent={backtest.strategy_code_python}
                  strategyType={backtest.strategy_type}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
