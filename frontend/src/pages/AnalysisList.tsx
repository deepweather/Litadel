import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyses } from '../hooks/useAnalyses'
import { AnalysisCard } from '../components/analysis/AnalysisCard'
import { Button } from '@/components/ui/button'
import { MetricCard } from '../components/common/MetricCard'
import { PageHeader } from '../components/layout/PageHeader'
import { SectionHeader } from '../components/layout/SectionHeader'
import { MetricGrid } from '../components/layout/MetricGrid'
import { EmptyState } from '../components/data-display/EmptyState'
import { Activity, Plus, RefreshCw } from 'lucide-react'
import type { Analysis } from '../types/api'

export const AnalysisList: React.FC = () => {
  const navigate = useNavigate()
  const { data: analysesData, isLoading, refetch } = useAnalyses()

  const analyses = analysesData?.items || []

  // Group analyses by status and date
  const groupedAnalyses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const active = analyses.filter(
      (a: Analysis) => a.status === 'running' || a.status === 'pending'
    )
    const completed = analyses.filter(
      (a: Analysis) => a.status === 'completed' || a.status === 'failed'
    )

    // Group completed by date
    const byDate: Record<string, Analysis[]> = {}
    completed.forEach((analysis: Analysis) => {
      const date = analysis.analysis_date
      if (!byDate[date]) byDate[date] = []
      byDate[date].push(analysis)
    })

    // Sort dates descending
    const sortedDates = Object.keys(byDate).sort().reverse()

    return { active, byDate, sortedDates, today }
  }, [analyses])

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayAnalyses = analyses.filter((a: Analysis) => a.analysis_date === today)
    const completedToday = todayAnalyses.filter((a: Analysis) => a.status === 'completed')

    // Count tickers
    const tickerCounts: Record<string, number> = {}
    analyses.forEach((a: Analysis) => {
      tickerCounts[a.ticker] = (tickerCounts[a.ticker] || 0) + 1
    })
    const topTicker = Object.entries(tickerCounts).sort((a, b) => b[1] - a[1])[0]

    // Calculate success rate
    const successRate =
      completedToday.length > 0
        ? Math.round((completedToday.length / todayAnalyses.length) * 100)
        : 0

    return {
      activeCount: groupedAnalyses.active.length,
      todayCount: todayAnalyses.length,
      successRate,
      topTicker: topTicker ? { ticker: topTicker[0], count: topTicker[1] } : null,
      totalAnalyses: analyses.length,
    }
  }, [analyses, groupedAnalyses.active])

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading analyses...</div>
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="ANALYSES COMMAND CENTER"
        actions={
          <>
            <Button onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              REFRESH
            </Button>
            <Button onClick={() => navigate('/analyses/create')}>
              <Plus size={16} />
              NEW ANALYSIS
            </Button>
          </>
        }
      />

      {/* Stats Dashboard */}
      <MetricGrid>
        {/* Active Analyses */}
        <MetricCard
          label="ACTIVE ANALYSES"
          value={stats.activeCount}
          icon={<Activity size={16} />}
          highlighted={stats.activeCount > 0}
          subValue={
            stats.activeCount === 1
              ? 'Running now'
              : stats.activeCount === 0
                ? 'All quiet'
                : 'Running now'
          }
        />

        {/* Today's Analyses */}
        <MetricCard
          label="TODAY'S ANALYSES"
          value={stats.todayCount}
          subValue={`${stats.successRate}% success rate`}
        />

        {/* Top Ticker */}
        {stats.topTicker && (
          <MetricCard
            label="TOP TICKER"
            value={stats.topTicker.ticker}
            subValue={`${stats.topTicker.count} analyses`}
          />
        )}

        {/* Total Analyses */}
        <MetricCard
          label="TOTAL ANALYSES"
          value={stats.totalAnalyses}
          subValue="All time"
        />
      </MetricGrid>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-auto">
        {/* Active Analyses Section */}
        {groupedAnalyses.active.length > 0 && (
          <div className="mb-8">
            <SectionHeader
              title="ACTIVE ANALYSES"
              count={groupedAnalyses.active.length}
              icon={<Activity size={18} />}
              variant="primary"
            />
            <div className="flex flex-col gap-3">
              {groupedAnalyses.active.map((analysis: Analysis) => (
                <AnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Decisions by Date */}
        {groupedAnalyses.sortedDates.length > 0 && (
          <div>
            <SectionHeader title="RECENT DECISIONS" />

            {groupedAnalyses.sortedDates.map((date) => (
              <div key={date} className="mb-6">
                <div className="text-sm text-muted-foreground font-mono mb-2 flex items-center gap-2">
                  <span>{date === groupedAnalyses.today ? 'TODAY' : date}</span>
                  <span className="text-xs">
                    ({groupedAnalyses.byDate[date].length} analyses)
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {groupedAnalyses.byDate[date].map((analysis) => (
                    <AnalysisCard key={analysis.id} analysis={analysis} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {analyses.length === 0 && (
          <EmptyState
            icon="📊"
            title="No analyses yet"
            description="Start your first analysis to see trading recommendations"
            action={
              <Button onClick={() => navigate('/analyses/create')}>
                <Plus size={16} />
                CREATE FIRST ANALYSIS
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
