import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { IconButton } from '../components/ui/IconButton'
import { PageHeader } from '../components/layout/PageHeader'
import { Panel } from '../components/layout/Panel'
import { StatusBadge } from '../components/data-display/StatusBadge'
import { LoadingState } from '../components/data-display/LoadingState'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../components/ui/Table'
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

  const getReturnColor = (value: number | null) => {
    if (value === null) return '#2a3e4a'
    return value >= 0 ? '#00ff00' : '#ff0000'
  }

  if (isLoading) {
    return <LoadingState message="Loading backtests..." />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="BACKTESTS"
        subtitle="Manage and analyze your trading strategy backtests"
        actions={
          <>
            <Button
              onClick={() => navigate('/backtests/chat')}
              style={{
                backgroundColor: 'rgba(0, 212, 255, 0.2)',
                borderColor: '#00d4ff',
                color: '#00d4ff'
              }}
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
      </Panel>

      {/* Table */}
      {!filteredBacktests || filteredBacktests.length === 0 ? (
        <Panel padding="lg">
          <div style={{ textAlign: 'center' }}>
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
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button
                onClick={() => navigate('/backtests/chat')}
                style={{
                  backgroundColor: 'rgba(0, 212, 255, 0.2)',
                  borderColor: '#00d4ff',
                  color: '#00d4ff'
                }}
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
          <Table bordered={false}>
            <TableHeader>
              <TableCell header align="left">NAME</TableCell>
              <TableCell header align="left">DATE RANGE</TableCell>
              <TableCell header align="center">STATUS</TableCell>
              <TableCell header align="right">RETURN</TableCell>
              <TableCell header align="right">SHARPE</TableCell>
              <TableCell header align="right">MAX DD</TableCell>
              <TableCell header align="right">TRADES</TableCell>
              <TableCell header align="center">ACTIONS</TableCell>
            </TableHeader>
            <TableBody>
              {filteredBacktests.map((backtest) => (
                <TableRow
                  key={backtest.id}
                  onClick={() => navigate(`/backtests/${backtest.id}`)}
                >
                  <TableCell>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {backtest.name}
                    </div>
                    {backtest.description && (
                      <div style={{ color: '#2a3e4a', fontSize: '0.75rem' }}>
                        {backtest.description.substring(0, 50)}
                        {backtest.description.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </TableCell>
                  <TableCell color="#2a3e4a">
                    {formatDateShort(backtest.start_date)} - {formatDateShort(backtest.end_date)}
                  </TableCell>
                  <TableCell align="center">
                    <StatusBadge status={backtest.status as 'pending' | 'running' | 'completed' | 'failed'} />
                  </TableCell>
                  <TableCell
                    align="right"
                    color={getReturnColor(backtest.total_return_pct)}
                    bold
                  >
                    {formatPercentageWithSign(backtest.total_return_pct)}
                  </TableCell>
                  <TableCell align="right">
                    {backtest.sharpe_ratio !== null ? backtest.sharpe_ratio.toFixed(2) : 'N/A'}
                  </TableCell>
                  <TableCell align="right" color="#ff0000">
                    {formatPercentageWithSign(backtest.max_drawdown_pct)}
                  </TableCell>
                  <TableCell align="right" color="#2a3e4a">
                    {backtest.total_trades !== null ? backtest.total_trades : 'N/A'}
                  </TableCell>
                  <TableCell
                    align="center"
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
