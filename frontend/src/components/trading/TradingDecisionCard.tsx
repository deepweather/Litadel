import React, { useState } from 'react'
import { DecisionBadge } from './DecisionBadge'
import { MarketMetricsGrid } from './MarketMetricsGrid'
import { Text } from '../../design-system/Typography/Text'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
  const [rationaleExpanded, setRationaleExpanded] = useState(false)
  const rationale = decision.rationale || ''
  const isLongRationale = rationale.length > 300

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
    <Card className={`border-2 border-primary ${className}`.trim()}>
      <CardContent className="p-6 font-mono">
        {/* Header Row: Decision + Ticker + Price */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <DecisionBadge decision={decision.decision as 'BUY' | 'SELL' | 'HOLD'} size="lg" />
          <div className="flex-1 min-w-0">
            <span className="text-2xl text-primary font-bold">
              {ticker} @ ${marketMetrics.currentPrice.toFixed(2)}
            </span>
            <span
              className={`text-md ml-3 ${marketMetrics.dailyChangePositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {marketMetrics.dailyChangePositive ? '↑' : '↓'}{' '}
              {Math.abs(marketMetrics.dailyChange).toFixed(2)}%
            </span>
          </div>
          {decision.confidence && (
            <div className="border border-border p-3 bg-muted/30 rounded">
              <Text size="sm" variant="subdued" as="div" className="mb-1">
                CONFIDENCE
              </Text>
              <div className="text-xl text-primary font-bold">
                {decision.confidence}%
              </div>
            </div>
          )}
        </div>

        {/* Market Metrics Grid */}
        <MarketMetricsGrid metrics={metrics} />

        {/* Analysis Context */}
        {marketMetrics.analysisPrice && (
          <div className="text-sm text-muted-foreground mb-4">
            Analysis performed at ${marketMetrics.analysisPrice.toFixed(2)} on {analysisDate}
            {' • '}
            Price {marketMetrics.currentPrice > marketMetrics.analysisPrice ? 'up' : 'down'}{' '}
            {Math.abs(
              ((marketMetrics.currentPrice - marketMetrics.analysisPrice) /
                marketMetrics.analysisPrice) *
                100
            ).toFixed(1)}
            % since analysis
          </div>
        )}

        {/* Rationale */}
        {rationale && (
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold mb-2 text-foreground">Rationale</h4>
            <div className="text-sm text-primary leading-relaxed">
              {isLongRationale && !rationaleExpanded
                ? rationale.substring(0, 300) + '...'
                : rationale}
            </div>
            {isLongRationale && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRationaleExpanded(!rationaleExpanded)}
                className="mt-2"
              >
                {rationaleExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Read More
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

