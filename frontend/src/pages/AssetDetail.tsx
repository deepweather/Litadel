import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Activity, ArrowLeft, Briefcase, Copy, Plus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PriceChart } from '../components/analysis/PriceChart'
import { AnalysisCard } from '../components/analysis/AnalysisCard'
import { useMarketData } from '../hooks/useMarketData'
import { formatCurrency } from '../utils/formatters'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const AssetDetail: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['ticker-summary', ticker],
    queryFn: () => api.getTickerSummary(ticker!),
    enabled: !!ticker,
  })

  const { data: positions } = useQuery({
    queryKey: ['ticker-positions', ticker],
    queryFn: () => api.getTickerPositions(ticker!),
    enabled: !!ticker,
  })

  const { data: analyses } = useQuery({
    queryKey: ['ticker-analyses', ticker],
    queryFn: () => api.getTickerAnalyses(ticker!),
    enabled: !!ticker,
  })

  const { data: marketData } = useMarketData(ticker)

  // Calculate market metrics from price data
  const marketMetrics = useMemo(() => {
    if (!marketData?.data || marketData.data.length === 0) return null

    const sortedData = [...marketData.data].sort((a, b) => a.Date.localeCompare(b.Date))
    const latest = sortedData[sortedData.length - 1]
    const previous = sortedData[sortedData.length - 2]

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

    // Parse volume
    let volumeValue: number | null = null
    if (latest.Volume !== undefined && latest.Volume !== null) {
      if (typeof latest.Volume === 'string') {
        const parsed = parseFloat(latest.Volume)
        volumeValue = !isNaN(parsed) && parsed > 0 ? parsed : null
      } else {
        volumeValue = latest.Volume > 0 ? latest.Volume : null
      }
    }

    return {
      currentPrice: latestPrice,
      dailyChange,
      dailyChangePositive: dailyChange >= 0,
      volume: volumeValue,
      dayHigh: latest.High ? Number(latest.High) : 0,
      dayLow: latest.Low ? Number(latest.Low) : 0,
      yearHigh: Math.max(...yearHighs),
      yearLow: Math.min(...yearLows.filter((l) => l > 0)),
      latestDate: latest.Date,
    }
  }, [marketData?.data])

  const getDecisionColorClass = (decision: string) => {
    switch (decision) {
      case 'BUY':
        return 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400'
      case 'SELL':
        return 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400'
      case 'HOLD':
        return 'text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400'
      default:
        return 'text-primary border-primary'
    }
  }

  const getPnLColorClass = (value: number) => {
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  const handleCopyTicker = () => {
    if (ticker) {
      navigator.clipboard.writeText(ticker)
      toast.success(`${ticker} copied to clipboard`)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (summaryLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono">
        Loading asset details...
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="p-8 text-center text-destructive font-mono">
        Asset not found
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        {/* Compact Header with Action Toolbar */}
        <Card className="border-2 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Back Button */}
              <Button onClick={() => navigate(-1)} variant="ghost" size="icon">
                <ArrowLeft size={18} />
              </Button>

              {/* Center: Ticker and Price Info */}
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-primary font-mono">
                    {summary.ticker}
                  </h1>
                  <Badge variant="outline" className="text-xs border-primary text-primary">
                    {summary.asset_class.toUpperCase()}
                  </Badge>
                </div>

                {marketMetrics && (
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-foreground font-mono">
                      {formatCurrency(marketMetrics.currentPrice)}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-sm font-mono",
                      marketMetrics.dailyChangePositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {marketMetrics.dailyChangePositive ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      <span>{marketMetrics.dailyChange.toFixed(2)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Quick Actions */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleCopyTicker} variant="outline" size="icon">
                      <Copy size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs">Copy ticker (⌘C)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleRefresh} variant="outline" size="icon">
                      <RefreshCw size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs">Refresh data (⌘R)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => navigate(`/analyses/create?ticker=${summary.ticker}`)}>
                      <Activity size={16} />
                      <span className="ml-2">RUN ANALYSIS</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs">Run AI analysis (⌘⏎)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          {/* Main Content Area with Tabs */}
          <div className="min-w-0">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="font-mono text-xs">OVERVIEW</TabsTrigger>
                <TabsTrigger value="holdings" className="font-mono text-xs">HOLDINGS</TabsTrigger>
                <TabsTrigger value="analyses" className="font-mono text-xs">ANALYSES</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Price Chart */}
                {ticker && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-mono text-primary flex items-center gap-2">
                        <TrendingUp size={16} />
                        PRICE HISTORY
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {marketData?.data ? (
                        <PriceChart data={marketData.data} height={250} mode="candles" />
                      ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm font-mono">
                          Loading chart data...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Latest Analysis Recommendation */}
                {summary.analyses.latest_decision && (
                  <Card className={cn(
                    "border-2",
                    getDecisionColorClass(summary.analyses.latest_decision.decision)
                  )}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs font-mono text-muted-foreground">
                        LATEST RECOMMENDATION ({summary.analyses.latest_decision.analysis_date})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className={cn(
                        "text-2xl font-bold font-mono",
                        getDecisionColorClass(summary.analyses.latest_decision.decision)
                      )}>
                        {summary.analyses.latest_decision.decision}
                        {summary.analyses.latest_decision.confidence && (
                          <span className="text-base ml-2">
                            ({summary.analyses.latest_decision.confidence}% confidence)
                          </span>
                        )}
                      </div>
                      {summary.analyses.latest_decision.rationale && (
                        <div className="text-sm text-foreground leading-relaxed font-mono">
                          {summary.analyses.latest_decision.rationale}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats Grid */}
                {summary.analyses.total_count > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-mono text-primary">ANALYSIS STATS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-secondary rounded">
                          <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL</div>
                          <div className="text-xl font-bold text-primary font-mono">{summary.analyses.total_count}</div>
                        </div>
                        {summary.analyses.decision_counts.BUY > 0 && (
                          <div className="p-3 bg-secondary rounded">
                            <div className="text-xs text-muted-foreground font-mono mb-1">BUY SIGNALS</div>
                            <div className="text-xl font-bold text-green-600 dark:text-green-400 font-mono">
                              {summary.analyses.decision_counts.BUY}
                            </div>
                          </div>
                        )}
                        {summary.analyses.decision_counts.HOLD > 0 && (
                          <div className="p-3 bg-secondary rounded">
                            <div className="text-xs text-muted-foreground font-mono mb-1">HOLD SIGNALS</div>
                            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400 font-mono">
                              {summary.analyses.decision_counts.HOLD}
                            </div>
                          </div>
                        )}
                        {summary.analyses.decision_counts.SELL > 0 && (
                          <div className="p-3 bg-secondary rounded">
                            <div className="text-xs text-muted-foreground font-mono mb-1">SELL SIGNALS</div>
                            <div className="text-xl font-bold text-red-600 dark:text-red-400 font-mono">
                              {summary.analyses.decision_counts.SELL}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Holdings Tab */}
              <TabsContent value="holdings" className="mt-4 space-y-4">
                {summary.holdings.total_positions > 0 ? (
                  <>
                    {/* Holdings Summary */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-mono text-primary flex items-center gap-2">
                          <Briefcase size={16} />
                          YOUR HOLDINGS
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-secondary rounded">
                            <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL QUANTITY</div>
                            <div className="text-lg font-bold text-primary font-mono">
                              {summary.holdings.total_quantity.toFixed(4)}
                            </div>
                          </div>
                          <div className="p-3 bg-secondary rounded">
                            <div className="text-xs text-muted-foreground font-mono mb-1">AVG ENTRY</div>
                            <div className="text-lg font-bold text-primary font-mono">
                              {formatCurrency(summary.holdings.avg_entry_price)}
                            </div>
                          </div>
                          <div className="p-3 bg-secondary rounded">
                            <div className="text-xs text-muted-foreground font-mono mb-1">CURRENT VALUE</div>
                            <div className="text-lg font-bold text-primary font-mono">
                              {formatCurrency(summary.holdings.current_value)}
                            </div>
                          </div>
                          <div className="p-3 bg-secondary rounded">
                            <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL P&L</div>
                            <div className={cn(
                              "text-lg font-bold font-mono",
                              getPnLColorClass(summary.holdings.total_pnl)
                            )}>
                              {formatCurrency(summary.holdings.total_pnl)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Positions List */}
                    {positions && positions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs font-mono text-muted-foreground">
                            POSITIONS ACROSS PORTFOLIOS ({positions.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {positions.map((pos, idx) => (
                            <div
                              key={idx}
                              onClick={() => navigate(`/portfolio/${pos.portfolio_id}`)}
                              className="flex justify-between items-center p-3 bg-secondary hover:bg-primary/10 cursor-pointer transition-all font-mono text-sm rounded"
                            >
                              <div>
                                <div className="text-primary mb-1 font-bold">
                                  {pos.portfolio_name}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {pos.position.quantity} units @ {formatCurrency(pos.position.entry_price)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={cn(
                                  "font-bold",
                                  getPnLColorClass(
                                    pos.position.status === 'open'
                                      ? pos.position.unrealized_pnl
                                      : pos.position.realized_pnl
                                  )
                                )}>
                                  {formatCurrency(
                                    pos.position.status === 'open'
                                      ? pos.position.unrealized_pnl
                                      : pos.position.realized_pnl
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {pos.position.status.toUpperCase()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Briefcase size={48} className="mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg text-primary font-mono mb-2">
                        No holdings yet
                      </h3>
                      <p className="text-muted-foreground font-mono text-sm mb-6">
                        Add this asset to one of your portfolios to start tracking positions
                      </p>
                      <Button onClick={() => navigate('/portfolio')}>
                        <Plus size={18} />
                        <span>GO TO PORTFOLIOS</span>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Analyses Tab */}
              <TabsContent value="analyses" className="mt-4 space-y-4">
                {analyses && analyses.length > 0 ? (
                  <div className="space-y-3">
                    {analyses.map((analysis) => (
                      <AnalysisCard key={analysis.id} analysis={analysis} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Activity size={48} className="mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg text-primary font-mono mb-2">
                        No analyses yet
                      </h3>
                      <p className="text-muted-foreground font-mono text-sm mb-6">
                        Run your first AI-powered analysis for {summary.ticker}
                      </p>
                      <Button onClick={() => navigate(`/analyses/create?ticker=${summary.ticker}`)}>
                        <Plus size={18} />
                        <span>RUN FIRST ANALYSIS</span>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Sidebar with Market Summary */}
          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-4">
              {/* Market Summary Card */}
              {marketMetrics && (
                <Card className="border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-mono text-primary">MARKET DATA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Current Price */}
                    <div>
                      <div className="text-xs text-muted-foreground font-mono mb-1">CURRENT PRICE</div>
                      <div className="text-2xl font-bold text-foreground font-mono">
                        {formatCurrency(marketMetrics.currentPrice)}
                      </div>
                    </div>

                    <Separator />

                    {/* 24h Change */}
                    <div>
                      <div className="text-xs text-muted-foreground font-mono mb-1">24H CHANGE</div>
                      <div className={cn(
                        "text-lg font-bold font-mono flex items-center gap-1",
                        marketMetrics.dailyChangePositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {marketMetrics.dailyChangePositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {marketMetrics.dailyChange.toFixed(2)}%
                      </div>
                    </div>

                    <Separator />

                    {/* Day Range */}
                    <div>
                      <div className="text-xs text-muted-foreground font-mono mb-1">DAY RANGE</div>
                      <div className="text-sm font-mono text-foreground">
                        {formatCurrency(marketMetrics.dayLow)} - {formatCurrency(marketMetrics.dayHigh)}
                      </div>
                    </div>

                    <Separator />

                    {/* 52-Week Range */}
                    <div>
                      <div className="text-xs text-muted-foreground font-mono mb-1">52-WEEK RANGE</div>
                      <div className="text-sm font-mono text-foreground">
                        {formatCurrency(marketMetrics.yearLow)} - {formatCurrency(marketMetrics.yearHigh)}
                      </div>
                    </div>

                    {marketMetrics.volume && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-xs text-muted-foreground font-mono mb-1">VOLUME</div>
                          <div className="text-sm font-mono text-foreground">
                            {marketMetrics.volume.toLocaleString()}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Last Updated */}
                    <div>
                      <div className="text-xs text-muted-foreground font-mono mb-1">LAST UPDATED</div>
                      <div className="text-xs font-mono text-foreground">
                        {marketMetrics.latestDate}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono text-primary">QUICK ACTIONS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => navigate(`/analyses/create?ticker=${summary.ticker}`)}
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Activity size={14} />
                    <span className="ml-2">Run Analysis</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/portfolio')}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Plus size={14} />
                    <span className="ml-2">Add to Portfolio</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

