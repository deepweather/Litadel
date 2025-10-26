import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { IconButton } from '../components/ui/IconButton'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/layout/Panel'
import { StatusBadge } from '../components/data-display/StatusBadge'
import { LoadingState } from '../components/data-display/LoadingState'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { formatDateShort, formatPercentageWithSign } from '../utils/formatters'

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

  if (isLoading) {
    return <LoadingState message="Loading backtests..." />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="BACKTESTS"
        subtitle="Manage and analyze your trading strategy backtests"
        actions={
          <>
            <Button
              onClick={() => navigate('/backtests/chat')}
              variant="outline"
              className="bg-primary/10 border-primary/50 text-primary hover:bg-primary/20"
            >
              <Sparkles size={18} />
              <span>CREATE WITH AI CHAT</span>
            </Button>
            <Button onClick={() => navigate('/backtests/create')}>
              <Plus size={18} />
              <span>CREATE (CLASSIC)</span>
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Panel>
        <div className="flex gap-4 items-center">
          <label className="text-muted-foreground font-mono text-sm">
            STATUS:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-input text-foreground font-mono text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </Panel>

      {/* Table */}
      {!filteredBacktests || filteredBacktests.length === 0 ? (
        <Panel padding="lg">
          <div className="text-center">
            <p className="text-muted-foreground font-mono text-base mb-4">
              No backtests found
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate('/backtests/chat')}
                variant="outline"
                className="bg-primary/10 border-primary/50 text-primary hover:bg-primary/20"
              >
                <Sparkles size={18} />
                <span>CREATE WITH AI CHAT</span>
              </Button>
              <Button onClick={() => navigate('/backtests/create')}>
                <Plus size={18} />
                <span>CREATE (CLASSIC)</span>
              </Button>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel padding="none" className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NAME</TableHead>
                <TableHead>DATE RANGE</TableHead>
                <TableHead className="text-center">STATUS</TableHead>
                <TableHead className="text-right">RETURN</TableHead>
                <TableHead className="text-right">SHARPE</TableHead>
                <TableHead className="text-right">MAX DD</TableHead>
                <TableHead className="text-right">TRADES</TableHead>
                <TableHead className="text-center">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBacktests.map((backtest) => (
                <TableRow
                  key={backtest.id}
                  onClick={() => navigate(`/backtests/${backtest.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-bold mb-1">{backtest.name}</div>
                    {backtest.description && (
                      <div className="text-muted-foreground text-xs">
                        {backtest.description.substring(0, 50)}
                        {backtest.description.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateShort(backtest.start_date)} - {formatDateShort(backtest.end_date)}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={backtest.status as 'pending' | 'running' | 'completed' | 'failed'} />
                  </TableCell>
                  <TableCell className={`text-right font-bold ${
                    backtest.total_return_pct === null
                      ? 'text-muted-foreground'
                      : backtest.total_return_pct >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPercentageWithSign(backtest.total_return_pct)}
                  </TableCell>
                  <TableCell className="text-right">
                    {backtest.sharpe_ratio !== null ? backtest.sharpe_ratio.toFixed(2) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400">
                    {formatPercentageWithSign(backtest.max_drawdown_pct)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {backtest.total_trades !== null ? backtest.total_trades : 'N/A'}
                  </TableCell>
                  <TableCell
                    className="text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconButton
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDelete(backtest.id, backtest.name)}
                      variant="danger"
                      title="Delete Backtest"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
    </div>
  )
}
