import React, { useState } from 'react'
import { DecisionBadge } from './DecisionBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { MarkdownViewer } from '../analysis/MarkdownViewer'
import { formatVolume, getAssetClass } from '@/utils/assetDetection'
import type { TradingDecision } from '../../types/api'

interface MarketMetrics {
  currentPrice: number
  referencePrice: number // Price at analysis date (used for volume calculation)
  dailyChange: number
  dailyChangePositive: boolean
  volume: number | null
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
  const isLongRationale = rationale.length > 500

  // Detect asset class and format volume accordingly
  // Use referencePrice (analysis date price) for volume calculation, not current price
  const assetClass = getAssetClass(ticker)
  const volumeDisplay = formatVolume(
    marketMetrics.volume,
    assetClass,
    ticker,
    marketMetrics.referencePrice
  )

  return (
    <Card className={`border border-primary py-3 gap-3 ${className}`.trim()}>
      <CardContent className="px-4 py-0 font-mono">
        {/* Compact Header: Decision Badge + Ticker/Price + Confidence on one line */}
        <div className="flex items-center gap-3 mb-3">
          <DecisionBadge decision={decision.decision as 'BUY' | 'SELL' | 'HOLD'} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="text-xl text-primary font-bold">
              {ticker} @ ${marketMetrics.currentPrice.toFixed(2)}
              <span
                className={`text-base ml-2 ${marketMetrics.dailyChangePositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {marketMetrics.dailyChangePositive ? '↑' : '↓'}{' '}
                {Math.abs(marketMetrics.dailyChange).toFixed(2)}%
              </span>
            </div>
          </div>
          {decision.confidence && (
            <div className="text-right shrink-0">
              <div className="text-[0.65rem] text-muted-foreground uppercase">Confidence</div>
              <div className="text-lg text-primary font-bold">
                {decision.confidence}%
              </div>
            </div>
          )}
        </div>

        {/* Compact Inline Metrics */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
          <span>
            <span className="text-foreground font-semibold">${marketMetrics.currentPrice.toFixed(2)}</span>
          </span>
          <span>•</span>
          <span>
            Range ${marketMetrics.dayLow.toFixed(2)}-${marketMetrics.dayHigh.toFixed(2)}
          </span>
          {volumeDisplay && (
            <>
              <span>•</span>
              <span>
                Vol {volumeDisplay}
              </span>
            </>
          )}
          <span>•</span>
          <span>
            52W ${marketMetrics.yearLow.toFixed(0)}-${marketMetrics.yearHigh.toFixed(0)}
          </span>
          {marketMetrics.analysisPrice && (
            <>
              <span>•</span>
              <span>
                {marketMetrics.currentPrice > marketMetrics.analysisPrice ? '↑' : '↓'}{' '}
                {Math.abs(
                  ((marketMetrics.currentPrice - marketMetrics.analysisPrice) /
                    marketMetrics.analysisPrice) *
                    100
                ).toFixed(1)}
                % since {analysisDate}
              </span>
            </>
          )}
        </div>

        {/* Rationale */}
        {rationale && (
          <>
            <Separator className="mb-3" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Rationale
                </h4>
                {isLongRationale && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRationaleExpanded(!rationaleExpanded)}
                    className="h-6 text-xs"
                  >
                    {rationaleExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Expand
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className={`text-sm ${!rationaleExpanded && isLongRationale ? 'max-h-32 overflow-hidden relative' : ''}`}>
                <MarkdownViewer content={rationale} />
                {!rationaleExpanded && isLongRationale && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

