import React from 'react'
import { DecisionBadge } from './DecisionBadge'
import { MarketMetricsGrid } from './MarketMetricsGrid'
import { Text } from '../../design-system/Typography/Text'
import type { TradingDecision } from '../../types/api'

interface MarketMetrics {
  currentPrice: number
  dailyChange: number
  dailyChangePositive: boolean
  volume: number
  dayHigh: number
  dayLow: number
  yearHigh: number
  yearLow: number
  analysisPrice: number | null
}

interface TradingDecisionCardProps {
  decision: TradingDecision
  ticker: string
  analysisDate: string
  marketMetrics: MarketMetrics
  className?: string
}

export const TradingDecisionCard: React.FC<TradingDecisionCardProps> = ({
  decision,
  ticker,
  analysisDate,
  marketMetrics,
  className = '',
}) => {
  const metrics = [
    {
      label: 'CURRENT PRICE',
      value: `$${marketMetrics.currentPrice.toFixed(2)}`,
    },
    {
      label: 'DAY RANGE',
      value: `$${marketMetrics.dayLow.toFixed(2)} - $${marketMetrics.dayHigh.toFixed(2)}`,
    },
    {
      label: 'VOLUME',
      value: `${(marketMetrics.volume / 1000000).toFixed(1)}M`,
    },
    {
      label: '52W RANGE',
      value: `$${marketMetrics.yearLow.toFixed(0)} - $${marketMetrics.yearHigh.toFixed(0)}`,
    },
  ]

  return (
    <div className={`border-2 border-primary bg-bg-highlight p-lg mb-lg font-mono ${className}`.trim()}>
      {/* Header Row: Decision + Ticker + Price */}
      <div className="flex items-center gap-base mb-base">
        <DecisionBadge decision={decision.decision as 'BUY' | 'SELL' | 'HOLD'} size="lg" />
        <div>
          <span className="text-2xl text-primary ml-base">
            {ticker} @ ${marketMetrics.currentPrice.toFixed(2)}
          </span>
          <span
            className={`text-md ml-base ${marketMetrics.dailyChangePositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {marketMetrics.dailyChangePositive ? '↑' : '↓'}{' '}
            {Math.abs(marketMetrics.dailyChange).toFixed(2)}%
          </span>
        </div>
        {decision.confidence && (
          <div className="border border-border p-sm bg-bg-hover ml-auto">
            <Text size="sm" variant="subdued" as="div">
              CONFIDENCE
            </Text>
            <div className="text-xl text-accent font-bold">
              {decision.confidence}%
            </div>
          </div>
        )}
      </div>

      {/* Market Metrics Grid */}
      <MarketMetricsGrid metrics={metrics} />

      {/* Analysis Context */}
      {marketMetrics.analysisPrice && (
        <Text size="sm" variant="subdued" className="mb-md">
          Analysis performed at ${marketMetrics.analysisPrice.toFixed(2)} on {analysisDate}
          {' • '}
          Price {marketMetrics.currentPrice > marketMetrics.analysisPrice ? 'up' : 'down'}{' '}
          {Math.abs(
            ((marketMetrics.currentPrice - marketMetrics.analysisPrice) /
              marketMetrics.analysisPrice) *
              100
          ).toFixed(1)}
          % since analysis
        </Text>
      )}

      {/* Rationale */}
      {decision.rationale && (
        <div className="text-base text-primary border-t border-border pt-md">
          {decision.rationale}
        </div>
      )}
    </div>
  )
}

