import React, { useEffect, useMemo } from 'react'
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
import { PriceChart } from '../components/analysis/PriceChart'
import { useMarketData } from '../hooks/useMarketData'
import { LogViewer } from '../components/analysis/LogViewer'
import { TradingDecisionCard } from '../components/trading/TradingDecisionCard'
import { Button } from '@/components/ui/button'
import { Collapsible } from '../components/interactive/Collapsible'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { categorizeReportsByType } from '@/config/reportTypes'
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Copy,
  Download,
  Eye,
  ListTree,
  MessageSquare,
  RefreshCw,
  Target,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

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

    // Use analysis date data if available, otherwise use latest
    const referenceData = analysisDateData || latest
    const previousData = analysisDateData && analysis?.analysis_date
      ? sortedData[sortedData.findIndex((d) => d.Date === analysis.analysis_date) - 1]
      : previous

    const latestPrice = latest.Close ? Number(latest.Close) : 0
    const referencePrice = referenceData.Close ? Number(referenceData.Close) : 0
    const previousClose = previousData?.Close ? Number(previousData.Close) : referencePrice
    const dailyChange = ((referencePrice - previousClose) / previousClose) * 100

    // Get 52-week range from analysis date (or latest if no analysis date)
    const referenceDate = new Date(referenceData.Date)
    const yearAgo = new Date(referenceDate)
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    const yearAgoStr = yearAgo.toISOString().split('T')[0]
    const referenceDateStr = referenceDate.toISOString().split('T')[0]
    const yearData = sortedData.filter((d) => d.Date >= yearAgoStr && d.Date <= referenceDateStr)
    const yearHighs = yearData.map((d) => Number(d.High || 0))
    const yearLows = yearData.map((d) => Number(d.Low || 0))

    // Parse volume from reference date (analysis date or latest)
    let volumeValue: number | null = null
    if (referenceData.Volume !== undefined && referenceData.Volume !== null) {
      // Handle both string and number types
      if (typeof referenceData.Volume === 'string') {
        const parsed = parseFloat(referenceData.Volume)
        volumeValue = !isNaN(parsed) && parsed > 0 ? parsed : null
      } else {
        volumeValue = referenceData.Volume > 0 ? referenceData.Volume : null
      }
    }

    return {
      currentPrice: latestPrice,
      referencePrice: referencePrice, // Price at analysis date (or latest if no analysis date)
      dailyChange,
      dailyChangePositive: dailyChange >= 0,
      volume: volumeValue,
      dayHigh: referenceData.High ? Number(referenceData.High) : 0,
      dayLow: referenceData.Low ? Number(referenceData.Low) : 0,
      yearHigh: Math.max(...yearHighs),
      yearLow: Math.min(...yearLows.filter((l) => l > 0)),
      analysisPrice: analysisDateData?.Close ? Number(analysisDateData.Close) : null,
      latestDate: latest.Date,
    }
  }, [marketData?.data, analysis?.analysis_date])

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
      toast.success('Analysis ID copied')
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

    toast.success('Analysis exported')
  }

  const handleDelete = async () => {
    if (!analysisId) return

    if (confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteMutation.mutateAsync(analysisId)
        toast.success('Analysis deleted')
        navigate('/analyses')
      } catch (error: any) {
        toast.error(error.detail || 'Failed to delete analysis')
      }
    }
  }

  // Get trading decision from API and enrich with rationale from report
  const tradeDecision = useMemo(() => {
    if (!analysis?.trading_decision) return null

    // Find FINAL_TRADE_DECISION or TRADE_DECISION report (case-insensitive)
    const decisionReport = reports.find(r =>
      r.report_type.toLowerCase() === 'final_trade_decision' ||
      r.report_type.toLowerCase() === 'trade_decision'
    )

    // Use report content as rationale if available, otherwise fall back to API field
    return {
      decision: analysis.trading_decision.decision,
      confidence: analysis.trading_decision.confidence,
      rationale: decisionReport?.content || analysis.trading_decision.rationale || ''
    }
  }, [
    analysis?.trading_decision?.decision,
    analysis?.trading_decision?.confidence,
    analysis?.trading_decision?.rationale,
    reports
  ])

  // Categorize reports by type for tabs
  const categorizedReports = useMemo(() => {
    return {
      decision: reports.filter(r => categorizeReportsByType(r.report_type) === 'decision'),
      market: reports.filter(r => categorizeReportsByType(r.report_type) === 'market'),
      sentiment: reports.filter(r => categorizeReportsByType(r.report_type) === 'sentiment'),
      investment: reports.filter(r => categorizeReportsByType(r.report_type) === 'investment'),
      risk: reports.filter(r => categorizeReportsByType(r.report_type) === 'risk'),
    }
  }, [reports])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 pb-4 mb-4 border-b">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return <div className="text-center py-12 text-destructive font-mono">Analysis not found</div>
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/analyses')}
                  aria-label="Back to analyses list"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Back to Analyses (Esc)</p>
              </TooltipContent>
            </Tooltip>
            <div>
              <h1 className="text-xl font-bold text-foreground font-mono">
                {analysis.ticker} • {analysis.analysis_date}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                ID: {analysisId?.substring(0, 8)}...
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyId}
                  aria-label="Copy analysis ID"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Copy ID (C)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExportAll}
                  aria-label="Export analysis data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Export All Data</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  aria-label="Refresh analysis"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Refresh (R)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  aria-label="Delete analysis"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Delete Analysis (D)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Error Banner */}
        {analysis.status === 'failed' && analysis.error_message && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>✗ ANALYSIS FAILED</AlertTitle>
            <AlertDescription>{analysis.error_message}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Area - Two Column with Sticky Sidebar */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: Main Content with Tabs */}
          <div className="min-w-0 overflow-auto pb-20">
            <Tabs defaultValue="overview" className="w-full">
              <div className="overflow-x-auto pb-2 mb-4 -mx-1 px-1">
                <TabsList className="w-max min-w-full justify-start inline-flex" aria-label="Analysis report categories">
                  <TabsTrigger value="overview" className="gap-2" aria-label="Overview of analysis">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="decision" className="gap-2" aria-label={`Trade decision reports${categorizedReports.decision.length > 0 ? `, ${categorizedReports.decision.length} available` : ''}`}>
                    <Target className="h-4 w-4" aria-hidden="true" />
                    Decision
                    {categorizedReports.decision.length > 0 && (
                      <span className="ml-1 text-xs" aria-hidden="true">({categorizedReports.decision.length})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="market" className="gap-2" aria-label={`Market analysis reports${categorizedReports.market.length > 0 ? `, ${categorizedReports.market.length} available` : ''}`}>
                    <BarChart3 className="h-4 w-4" aria-hidden="true" />
                    Market
                    {categorizedReports.market.length > 0 && (
                      <span className="ml-1 text-xs" aria-hidden="true">({categorizedReports.market.length})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sentiment" className="gap-2" aria-label={`Sentiment analysis reports${categorizedReports.sentiment.length > 0 ? `, ${categorizedReports.sentiment.length} available` : ''}`}>
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Sentiment
                    {categorizedReports.sentiment.length > 0 && (
                      <span className="ml-1 text-xs" aria-hidden="true">({categorizedReports.sentiment.length})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="investment" className="gap-2" aria-label={`Investment plan reports${categorizedReports.investment.length > 0 ? `, ${categorizedReports.investment.length} available` : ''}`}>
                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                    Investment
                    {categorizedReports.investment.length > 0 && (
                      <span className="ml-1 text-xs" aria-hidden="true">({categorizedReports.investment.length})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="all" className="gap-2" aria-label={`All analysis reports${reports.length > 0 ? `, ${reports.length} available` : ''}`}>
                    <ListTree className="h-4 w-4" aria-hidden="true" />
                    All Reports
                    {reports.length > 0 && (
                      <span className="ml-1 text-xs" aria-hidden="true">({reports.length})</span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Trading Decision Card */}
                {tradeDecision && analysis.status === 'completed' && marketMetrics && (
                  <TradingDecisionCard
                    decision={tradeDecision}
                    ticker={analysis.ticker}
                    analysisDate={analysis.analysis_date}
                    marketMetrics={marketMetrics}
                  />
                )}

                {/* Price Chart */}
                {marketData?.data && marketData.data.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold font-mono text-foreground mb-3">
                      Price Action (60 Days)
                    </h3>
                    <PriceChart
                      data={marketData.data as any}
                      height={240}
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

                {/* Summary of key reports */}
                {reports.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold font-mono text-foreground mb-3">
                      Key Reports Summary
                    </h3>
                    <ReportViewer reports={reports.slice(0, 3)} defaultExpandFirst={true} />
                  </div>
                )}

                {reports.length === 0 && analysis.status !== 'running' && (
                  <div className="text-center py-12 text-muted-foreground font-mono">
                    No reports available
                  </div>
                )}

                {analysis.status === 'running' && (
                  <div className="text-center py-12 text-muted-foreground font-mono">
                    Analysis in progress...
                  </div>
                )}
              </TabsContent>

              {/* Decision Tab */}
              <TabsContent value="decision" className="mt-0">
                {categorizedReports.decision.length > 0 ? (
                  <ReportViewer reports={categorizedReports.decision} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground font-mono">
                    No trade decision reports
                  </div>
                )}
              </TabsContent>

              {/* Market Analysis Tab */}
              <TabsContent value="market" className="mt-0">
                {categorizedReports.market.length > 0 ? (
                  <ReportViewer reports={categorizedReports.market} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground font-mono">
                    No market analysis reports
                  </div>
                )}
              </TabsContent>

              {/* Sentiment Tab */}
              <TabsContent value="sentiment" className="mt-0">
                {categorizedReports.sentiment.length > 0 ? (
                  <ReportViewer reports={categorizedReports.sentiment} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground font-mono">
                    No sentiment reports
                  </div>
                )}
              </TabsContent>

              {/* Investment Tab */}
              <TabsContent value="investment" className="mt-0">
                {categorizedReports.investment.length > 0 ? (
                  <ReportViewer reports={categorizedReports.investment} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground font-mono">
                    No investment reports
                  </div>
                )}
              </TabsContent>

              {/* All Reports Tab */}
              <TabsContent value="all" className="mt-0">
                {reports.length > 0 ? (
                  <ReportViewer reports={reports} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground font-mono">
                    No reports available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Status + Pipeline (Sticky Sidebar) */}
          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              <AnalysisStatusCard analysis={analysis} />
              <AgentPipeline
                currentAgent={analysis.current_agent ?? null}
                status={analysis.status}
                logs={logs}
                selectedAnalysts={analysis.selected_analysts}
              />
            </div>
          </div>

          {/* Mobile: Status below on small screens */}
          <div className="lg:hidden space-y-4 mt-6">
            <AnalysisStatusCard analysis={analysis} />
            <AgentPipeline
              currentAgent={analysis.current_agent ?? null}
              status={analysis.status}
              logs={logs}
              selectedAnalysts={analysis.selected_analysts}
            />
          </div>
        </div>

        {/* Sticky Logs Section at Bottom */}
        {logs.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] z-20 bg-background border-t shadow-2xl">
            <Collapsible title="EXECUTION LOGS" count={logs.length} defaultExpanded={false}>
              <div className="max-h-[60vh] overflow-auto">
                <LogViewer logs={logs} analysisStartTime={analysis.created_at || undefined} autoScroll={false} />
              </div>
            </Collapsible>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
