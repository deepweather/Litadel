import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useAnalysis,
  useAnalysisLogs,
  useAnalysisReports,
  useDeleteAnalysis,
} from '../hooks/useAnalyses'
import { useRealTimeStatus } from '../hooks/useRealTimeStatus'
import { AnalysisStatusCard } from '../components/analysis/AnalysisStatusCard'
import { AgentPipeline } from '../components/agents/AgentPipeline'
import { ReportViewer } from '../components/analysis/ReportViewer'
import PriceChart from '../components/analysis/PriceChart.tsx'
import { useMarketData } from '../hooks/useMarketData'
import { LogViewer } from '../components/analysis/LogViewer'
import { TradingDecisionCard } from '../components/trading/TradingDecisionCard'
import { Button } from '@/components/ui/button'
import { IconButton } from '../components/ui/IconButton'
import { Collapsible } from '../components/interactive/Collapsible'
import { InfoBanner } from '../components/ui/InfoBanner'
import {
  ArrowLeft,
  Copy,
  Download,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

export const AnalysisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const analysisId = id || null

  const { data: analysis, isLoading, refetch } = useAnalysis(analysisId)
  const { data: reports = [] } = useAnalysisReports(analysisId)
  const { data: marketData } = useMarketData(analysis?.ticker)
  const { data: logs = [] } = useAnalysisLogs(analysisId)
  const deleteMutation = useDeleteAnalysis()

  // Calculate market metrics
  const marketMetrics = React.useMemo(() => {
    if (!marketData?.data || marketData.data.length === 0) return null

    const sortedData = [...marketData.data].sort((a, b) => a.Date.localeCompare(b.Date))

    const latest = sortedData[sortedData.length - 1]
    const previous = sortedData[sortedData.length - 2]

    // Find data at analysis date
    const analysisDateData = analysis?.analysis_date
      ? sortedData.find((d) => d.Date === analysis.analysis_date)
      : null

    const latestPrice = latest.Close ? Number(latest.Close) : 0
    const previousClose = previous?.Close ? Number(previous.Close) : latestPrice
    const dailyChange = ((latestPrice - previousClose) / previousClose) * 100

    // Get 52-week range
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    const yearAgoStr = yearAgo.toISOString().split('T')[0]
    const yearData = sortedData.filter((d) => d.Date >= yearAgoStr)
    const yearHighs = yearData.map((d) => Number(d.High || 0))
    const yearLows = yearData.map((d) => Number(d.Low || 0))

    return {
      currentPrice: latestPrice,
      dailyChange,
      dailyChangePositive: dailyChange >= 0,
      volume: latest.Volume ? Number(latest.Volume) : 0,
      dayHigh: latest.High ? Number(latest.High) : 0,
      dayLow: latest.Low ? Number(latest.Low) : 0,
      yearHigh: Math.max(...yearHighs),
      yearLow: Math.min(...yearLows.filter((l) => l > 0)),
      analysisPrice: analysisDateData?.Close ? Number(analysisDateData.Close) : null,
      latestDate: latest.Date,
    }
  }, [marketData, analysis])

  // Connect to WebSocket for real-time updates
  useRealTimeStatus(analysisId, analysis?.status)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/analyses')
      } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        refetch()
      } else if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        handleCopyId()
      } else if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        handleDelete()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigate, refetch, analysisId])

  const handleCopyId = () => {
    if (analysisId) {
      navigator.clipboard.writeText(analysisId)
      toast.success('Analysis ID copied', {
        style: {
          background: '#1a2a3a',
          color: '#4da6ff',
          border: '1px solid #4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })
    }
  }

  const handleExportAll = () => {
    if (!analysis) return

    const exportData = {
      analysis: {
        id: analysis.id,
        ticker: analysis.ticker,
        date: analysis.analysis_date,
        status: analysis.status,
        created_at: analysis.created_at,
        completed_at: analysis.completed_at,
      },
      reports: reports.map((r) => ({ type: r.report_type, content: r.content })),
      logs: logs.map((l) => ({
        timestamp: l.timestamp,
        agent: l.agent_name,
        type: l.log_type,
        content: l.content,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis_${analysis.ticker}_${analysis.analysis_date}_${analysis.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Analysis exported', {
      style: {
        background: '#1a2a3a',
        color: '#4da6ff',
        border: '1px solid #4da6ff',
        fontFamily: 'JetBrains Mono, monospace',
      },
    })
  }

  const handleDelete = async () => {
    if (!analysisId) return

    if (confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteMutation.mutateAsync(analysisId)
        toast.success('Analysis deleted', {
          style: {
            background: '#1a2a3a',
            color: '#4da6ff',
            border: '1px solid #4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
          },
        })
        navigate('/analyses')
      } catch (error: any) {
        toast.error(error.detail || 'Failed to delete analysis', {
          style: {
            background: '#1a2a3a',
            color: '#ff4444',
            border: '1px solid #ff4444',
            fontFamily: 'JetBrains Mono, monospace',
          },
        })
      }
    }
  }

  // Get trading decision from API
  const tradeDecision = analysis?.trading_decision

  if (isLoading) {
    return <div className="text-terminal-accent text-center py-12">Loading analysis...</div>
  }

  if (!analysis) {
    return <div className="text-terminal-error text-center py-12">Analysis not found</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header - Minimal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1rem',
          marginBottom: '1rem',
          borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button onClick={() => navigate('/analyses')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {analysis.ticker} • {analysis.analysis_date}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <IconButton
            icon={<Copy size={16} />}
            onClick={handleCopyId}
            variant="primary"
            title="Copy Analysis ID"
          />
          <IconButton
            icon={<Download size={16} />}
            onClick={handleExportAll}
            variant="primary"
            title="Export All Data"
          />
          <IconButton
            icon={<RefreshCw size={16} />}
            onClick={() => refetch()}
            variant="primary"
            title="Refresh"
          />
          <IconButton
            icon={<Trash2 size={16} />}
            onClick={handleDelete}
            variant="danger"
            disabled={deleteMutation.isPending}
            title="Delete Analysis"
          />
        </div>
      </div>

      {/* Error Banner */}
      {analysis.status === 'failed' && analysis.error_message && (
        <InfoBanner variant="error" title="✗ ANALYSIS FAILED">
          {analysis.error_message}
        </InfoBanner>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '1.5rem' }}>
        {/* Left: Reports (Primary Content) */}
        <div style={{ flex: '1 1 70%', minWidth: 0, overflow: 'auto', paddingRight: '1rem' }}>
          {/* Trading Decision Card */}
          {tradeDecision && analysis.status === 'completed' && marketMetrics && (
            <TradingDecisionCard
              decision={tradeDecision}
              ticker={analysis.ticker}
              analysisDate={analysis.analysis_date}
              marketMetrics={marketMetrics}
            />
          )}

          {/* Price Chart - Now smaller and below decision */}
          {marketData?.data && marketData.data.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#5a6e7a',
                  fontFamily: 'JetBrains Mono, monospace',
                  marginBottom: '0.5rem',
                }}
              >
                PRICE ACTION (60 DAYS)
              </div>
              <PriceChart
                data={marketData.data as any}
                height={200}
                analysisDate={analysis.analysis_date}
                mode={
                  [
                    'BRENT',
                    'WTI',
                    'NATURAL_GAS',
                    'COPPER',
                    'ALUMINUM',
                    'WHEAT',
                    'CORN',
                    'SUGAR',
                    'COTTON',
                    'COFFEE',
                  ].includes((analysis.ticker || '').toUpperCase())
                    ? 'line'
                    : 'candles'
                }
              />
            </div>
          )}

          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
            }}
          >
            ANALYSIS REPORTS
          </div>
          {reports.length > 0 ? (
            <ReportViewer reports={reports} />
          ) : (
            <div
              style={{
                border: '1px solid rgba(77, 166, 255, 0.3)',
                padding: '2rem',
                textAlign: 'center',
                color: '#2a3e4a',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {analysis.status === 'running' ? 'Analysis in progress...' : 'No reports available'}
            </div>
          )}
        </div>

        {/* Right: Status + Pipeline (Secondary) */}
        <div
          style={{
            flex: '0 0 300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '0.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
            }}
          >
            ANALYSIS STATUS
          </div>
          <AnalysisStatusCard analysis={analysis} />
          <AgentPipeline
            currentAgent={analysis.current_agent ?? null}
            status={analysis.status}
            logs={logs}
            selectedAnalysts={analysis.selected_analysts}
          />
        </div>
      </div>

      {/* Logs Section (Collapsible) */}
      {logs.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <Collapsible title="EXECUTION LOGS" count={logs.length} defaultExpanded={false}>
            <LogViewer logs={logs} analysisStartTime={analysis.created_at || undefined} />
          </Collapsible>
        </div>
      )}
    </div>
  )
}
