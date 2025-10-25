import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyses } from '../hooks/useAnalyses'
import { AnalysisCard } from '../components/analysis/AnalysisCard'
import { Button } from '../components/ui/Button'
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
    return <div className="text-terminal-accent text-center py-12">Loading analyses...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
        }}
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          ANALYSES COMMAND CENTER
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            REFRESH
          </Button>
          <Button onClick={() => navigate('/analyses/create')}>
            <Plus size={16} />
            NEW ANALYSIS
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Active Analyses */}
        <div
          style={{
            border: '1px solid rgba(77, 166, 255, 0.3)',
            padding: '1rem',
            backgroundColor: stats.activeCount > 0 ? 'rgba(0, 212, 255, 0.02)' : 'transparent',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
          >
            <Activity size={16} color="#00d4ff" />
            <span style={{ fontSize: '0.75rem', color: '#5a6e7a' }}>ACTIVE ANALYSES</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00d4ff' }}>
            {stats.activeCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#5a6e7a' }}>
            {stats.activeCount === 1
              ? 'Running now'
              : stats.activeCount === 0
                ? 'All quiet'
                : 'Running now'}
          </div>
        </div>

        {/* Today's Analyses */}
        <div
          style={{
            border: '1px solid rgba(77, 166, 255, 0.3)',
            padding: '1rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#5a6e7a', marginBottom: '0.5rem' }}>
            TODAY'S ANALYSES
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4da6ff' }}>
            {stats.todayCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#5a6e7a' }}>
            {stats.successRate}% success rate
          </div>
        </div>

        {/* Top Ticker */}
        {stats.topTicker && (
          <div
            style={{
              border: '1px solid rgba(77, 166, 255, 0.3)',
              padding: '1rem',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#5a6e7a', marginBottom: '0.5rem' }}>
              TOP TICKER
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00d4ff' }}>
              {stats.topTicker.ticker}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#5a6e7a' }}>
              {stats.topTicker.count} analyses
            </div>
          </div>
        )}

        {/* Total Analyses */}
        <div
          style={{
            border: '1px solid rgba(77, 166, 255, 0.3)',
            padding: '1rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#5a6e7a', marginBottom: '0.5rem' }}>
            TOTAL ANALYSES
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4da6ff' }}>
            {stats.totalAnalyses}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#5a6e7a' }}>All time</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {/* Active Analyses Section */}
        {groupedAnalyses.active.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#00d4ff',
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid rgba(0, 212, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Activity size={18} />
              ACTIVE ANALYSES ({groupedAnalyses.active.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {groupedAnalyses.active.map((analysis: Analysis) => (
                <AnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Decisions by Date */}
        {groupedAnalyses.sortedDates.length > 0 && (
          <div>
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
              RECENT DECISIONS
            </div>

            {groupedAnalyses.sortedDates.map((date) => (
              <div key={date} style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#5a6e7a',
                    fontFamily: 'JetBrains Mono, monospace',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>{date === groupedAnalyses.today ? 'TODAY' : date}</span>
                  <span style={{ fontSize: '0.7rem' }}>
                    ({groupedAnalyses.byDate[date].length} analyses)
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
          <div
            style={{
              textAlign: 'center',
              padding: '4rem',
              color: '#5a6e7a',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>📊</div>
            <div style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No analyses yet</div>
            <div style={{ marginBottom: '2rem' }}>
              Start your first analysis to see trading recommendations
            </div>
            <Button onClick={() => navigate('/analyses/create')}>CREATE FIRST ANALYSIS</Button>
          </div>
        )}
      </div>
    </div>
  )
}
