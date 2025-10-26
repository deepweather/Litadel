import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Activity, ArrowLeft, Briefcase, Plus, TrendingUp } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { MetricCard } from '../components/common/MetricCard'
import { PriceChart } from '../components/analysis/PriceChart'
import { AnalysisCard } from '../components/analysis/AnalysisCard'
import { useMarketData } from '../hooks/useMarketData'
import { formatCurrency } from '../utils/formatters'
import { getDecisionColor, getPnLColor, themeColors } from '../utils/colors'

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

  if (summaryLoading) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#2a3e4a',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Loading asset details...
      </div>
    )
  }

  if (!summary) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#ff0000',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Asset not found
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back Button */}
      <Button onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={18} />
        <span>BACK</span>
      </Button>

      {/* Asset Header */}
      <div style={{ border: '2px solid #4da6ff', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#4da6ff',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {summary.ticker}
              </h1>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  border: '1px solid #4da6ff',
                  color: '#4da6ff',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {summary.asset_class.toUpperCase()}
              </span>
            </div>
            {summary.current_price && (
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#00d4ff',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {formatCurrency(summary.current_price)}
              </div>
            )}
          </div>
          <Button onClick={() => navigate(`/analyses/create?ticker=${summary.ticker}`)}>
            <Activity size={18} />
            <span>RUN ANALYSIS</span>
          </Button>
        </div>
      </div>

      {/* Price Chart */}
      {ticker && (
        <div>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '1rem',
            }}
          >
            <TrendingUp size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
            PRICE HISTORY
          </h2>
          {marketData?.data ? (
            <PriceChart data={marketData.data} height={300} mode="candles" />
          ) : (
            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2a3e4a',
              }}
            >
              Loading chart data...
            </div>
          )}
        </div>
      )}

      {/* Portfolio Holdings */}
      {summary.holdings.total_positions > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <Briefcase size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
              YOUR HOLDINGS
            </h2>
          </div>

          {/* Holdings Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <MetricCard
              label="TOTAL QUANTITY"
              value={summary.holdings.total_quantity.toFixed(4)}
              color={themeColors.primary}
            />
            <MetricCard
              label="AVG ENTRY PRICE"
              value={formatCurrency(summary.holdings.avg_entry_price)}
              color={themeColors.primary}
            />
            <MetricCard
              label="CURRENT VALUE"
              value={formatCurrency(summary.holdings.current_value)}
              color={themeColors.accent}
            />
            <MetricCard
              label="TOTAL P&L"
              value={formatCurrency(summary.holdings.total_pnl)}
              color={getPnLColor(summary.holdings.total_pnl)}
            />
          </div>

          {/* Positions List */}
          {positions && positions.length > 0 && (
            <div
              style={{
                border: '1px solid rgba(77, 166, 255, 0.3)',
                padding: '1rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#4da6ff',
                  fontFamily: 'JetBrains Mono, monospace',
                  marginBottom: '0.75rem',
                }}
              >
                POSITIONS ACROSS PORTFOLIOS ({positions.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {positions.map((pos, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/portfolio/${pos.portfolio_id}`)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#1a2a3a',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.875rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a2a3a'
                    }}
                  >
                    <div>
                      <div style={{ color: '#4da6ff', marginBottom: '0.25rem' }}>
                        {pos.portfolio_name}
                      </div>
                      <div style={{ color: '#2a3e4a', fontSize: '0.75rem' }}>
                        {pos.position.quantity} units @ {formatCurrency(pos.position.entry_price)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          color: getPnLColor(
                            pos.position.status === 'open'
                              ? pos.position.unrealized_pnl
                              : pos.position.realized_pnl
                          ),
                          fontWeight: 'bold',
                        }}
                      >
                        {formatCurrency(
                          pos.position.status === 'open'
                            ? pos.position.unrealized_pnl
                            : pos.position.realized_pnl
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#2a3e4a',
                        }}
                      >
                        {pos.position.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis History */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <Activity size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
            ANALYSIS HISTORY ({summary.analyses.total_count})
          </h2>
        </div>

        {/* Analysis Stats */}
        {summary.analyses.total_count > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <MetricCard
              label="TOTAL ANALYSES"
              value={summary.analyses.total_count}
              color={themeColors.primary}
            />

            {summary.analyses.decision_counts.BUY > 0 && (
              <MetricCard
                label="BUY SIGNALS"
                value={summary.analyses.decision_counts.BUY}
                color={themeColors.success}
                borderColor={`${themeColors.success}50`}
              />
            )}

            {summary.analyses.decision_counts.HOLD > 0 && (
              <MetricCard
                label="HOLD SIGNALS"
                value={summary.analyses.decision_counts.HOLD}
                color={themeColors.warning}
                borderColor={`${themeColors.warning}50`}
              />
            )}

            {summary.analyses.decision_counts.SELL > 0 && (
              <MetricCard
                label="SELL SIGNALS"
                value={summary.analyses.decision_counts.SELL}
                color={themeColors.error}
                borderColor={`${themeColors.error}50`}
              />
            )}
          </div>
        )}

        {/* Latest Decision */}
        {summary.analyses.latest_decision && (
          <div
            style={{
              border: `2px solid ${getDecisionColor(summary.analyses.latest_decision.decision)}`,
              padding: '1rem',
              marginBottom: '1rem',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#2a3e4a', marginBottom: '0.5rem' }}>
              LATEST RECOMMENDATION ({summary.analyses.latest_decision.analysis_date})
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: getDecisionColor(summary.analyses.latest_decision.decision),
                marginBottom: '0.5rem',
              }}
            >
              {summary.analyses.latest_decision.decision}
              {summary.analyses.latest_decision.confidence && (
                <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
                  ({summary.analyses.latest_decision.confidence}% confidence)
                </span>
              )}
            </div>
            {summary.analyses.latest_decision.rationale && (
              <div style={{ fontSize: '0.875rem', color: '#fff', lineHeight: '1.5' }}>
                {summary.analyses.latest_decision.rationale}
              </div>
            )}
          </div>
        )}

        {/* Analyses Timeline */}
        {analyses && analyses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analyses.map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        ) : (
          <div
            style={{
              border: '1px solid rgba(77, 166, 255, 0.3)',
              padding: '2rem',
              textAlign: 'center',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <div style={{ fontSize: '1rem', color: '#4da6ff', marginBottom: '1rem' }}>
              No analyses yet for {summary.ticker}
            </div>
            <Button onClick={() => navigate(`/analyses/create?ticker=${summary.ticker}`)}>
              <Plus size={18} />
              <span>RUN FIRST ANALYSIS</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

