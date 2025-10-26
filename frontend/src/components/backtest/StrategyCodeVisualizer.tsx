import React from 'react'
import { Code, Eye, Shield, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { PythonCodeEditor } from './PythonCodeEditor'

interface StrategyCodeVisualizerProps {
  codeContent: string
  strategyType?: string
}

export const StrategyCodeVisualizer: React.FC<StrategyCodeVisualizerProps> = ({
  codeContent,
  strategyType = 'single_ticker',
}) => {
  interface StrategyInfo {
    className: string
    indicators: string[]
    entrySignals: string[]
    exitSignals: string[]
    riskParams: string[]
  }

  const parseStrategy = (): StrategyInfo | null => {
    try {
      const lines = codeContent.split('\n')
      const info: StrategyInfo = {
        className: '',
        indicators: [],
        entrySignals: [],
        exitSignals: [],
        riskParams: [],
      }

      // Extract class name
      for (const line of lines) {
        const classMatch = line.match(/class\s+(\w+)\(Strategy\):/)
        if (classMatch) {
          info.className = classMatch[1]
          break
        }
      }

      // Extract indicators from init method
      let inInit = false
      for (const line of lines) {
        if (line.includes('def init(self):')) {
          inInit = true
          continue
        }
        if (inInit && line.includes('def ')) {
          inInit = false
        }
        if (inInit && line.includes('self.I(')) {
          // Extract indicator type
          const indicatorMatch = line.match(/self\.I\((\w+)/)
          if (indicatorMatch) {
            info.indicators.push(indicatorMatch[1])
          }
        }
      }

      // Extract entry/exit signals from next method
      let inNext = false
      for (const line of lines) {
        if (line.includes('def next(self):')) {
          inNext = true
          continue
        }
        if (inNext && line.includes('def ')) {
          inNext = false
        }
        if (inNext) {
          if (line.includes('self.buy()')) {
            info.entrySignals.push('Buy signal detected')
          }
          if (line.includes('crossover(')) {
            info.entrySignals.push('Crossover strategy')
          }
          if (line.includes('self.position.close()')) {
            info.exitSignals.push('Close position')
          }
          if (line.includes('sl=')) {
            info.riskParams.push('Stop loss configured')
          }
          if (line.includes('tp=')) {
            info.riskParams.push('Take profit configured')
          }
        }
      }

      return info
    } catch (e) {
      console.error('Failed to parse strategy:', e)
      return null
    }
  }

  const strategy = parseStrategy()

  if (!strategy) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Unable to parse strategy. Please check code format.
      </div>
    )
  }

  return (
    <div className="mt-4">
      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Eye size={16} />
            Visual Summary
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code size={16} />
            Python Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="max-h-[600px] overflow-y-auto space-y-4">
          {/* Strategy Header */}
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-500 text-xl">{strategy.className}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  {strategyType === 'portfolio' ? 'Portfolio Strategy' : 'Single Ticker'}
                </Badge>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  backtesting.py
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Indicators */}
          {strategy.indicators.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                  <Target size={16} />
                  Technical Indicators
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {strategy.indicators.map((indicator, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-purple-500/20 text-purple-400 border-purple-400"
                    >
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entry Signals */}
          {strategy.entrySignals.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                  <TrendingUp size={16} />
                  Entry Signals
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.entrySignals.map((signal, idx) => (
                  <div key={idx} className="bg-green-500/5 border border-green-500/20 rounded p-3">
                    <p className="text-sm text-muted-foreground">{signal}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Exit Signals */}
          {strategy.exitSignals.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                  <TrendingDown size={16} />
                  Exit Signals
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.exitSignals.map((signal, idx) => (
                  <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded p-3">
                    <p className="text-sm text-muted-foreground">{signal}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk Management */}
          {strategy.riskParams.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide">
                  <Shield size={16} />
                  Risk Management
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {strategy.riskParams.map((param, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{param}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="code">
          <PythonCodeEditor code={codeContent} readOnly height="600px" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

