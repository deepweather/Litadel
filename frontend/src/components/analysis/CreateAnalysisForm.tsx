import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyses, useCreateAnalysis } from '../../hooks/useAnalyses'
import { ANALYST_TYPES, type AnalystType } from '../../types/analysis'
import { Button } from '@/components/ui/button'
import { FormInput as Input } from '@/components/ui/form-input'
import { FormCheckbox as Checkbox } from '@/components/ui/form-checkbox'
import { ASCIIBox } from '../ui/ASCIIBox'
import { Clock, Search, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

type Preset = 'quick' | 'standard' | 'deep'

const ANALYST_DESCRIPTIONS: Record<AnalystType, string> = {
  macro: 'Economic indicators (GDP, CPI, rates)',
  market: 'Technical analysis, price action, trends',
  news: 'Latest news impact and sentiment',
  social: 'Social media sentiment analysis',
  fundamentals: 'Financial metrics (stocks only)',
}

const POPULAR_TICKERS = ['BTC', 'ETH', 'AAPL', 'TSLA', 'MSFT', 'NVDA']

interface CreateAnalysisFormProps {
  initialTicker?: string
}

export const CreateAnalysisForm: React.FC<CreateAnalysisFormProps> = ({ initialTicker }) => {
  const navigate = useNavigate()
  const createMutation = useCreateAnalysis()
  const { data: analysesData } = useAnalyses()

  const [ticker, setTicker] = useState(initialTicker || '')
  const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedAnalysts, setSelectedAnalysts] = useState<AnalystType[]>([
    'macro',
    'market',
    'news',
    'social',
  ])
  const [researchDepth, setResearchDepth] = useState(1)
  const [showConfirm, setShowConfirm] = useState(false)

  // Refs for guided UX
  const confirmSectionRef = useRef<HTMLDivElement | null>(null)
  const actionButtonsRef = useRef<HTMLDivElement | null>(null)

  // Get recent tickers from analyses
  const recentTickers = React.useMemo(() => {
    const analyses = analysesData?.items || []
    const uniqueTickers = [...new Set(analyses.map((a) => a.ticker))]
    return uniqueTickers.slice(0, 6)
  }, [analysesData])

  const handleAnalystToggle = (analyst: AnalystType) => {
    setSelectedAnalysts((prev) =>
      prev.includes(analyst) ? prev.filter((a) => a !== analyst) : [...prev, analyst]
    )
  }

  const handleSelectAll = () => {
    setSelectedAnalysts([...ANALYST_TYPES])
  }

  const handleSelectNone = () => {
    setSelectedAnalysts([])
  }

  const applyPreset = (preset: Preset) => {
    switch (preset) {
      case 'quick':
        setSelectedAnalysts(['market'])
        setResearchDepth(1)
        break
      case 'standard':
        setSelectedAnalysts(['macro', 'market', 'news', 'social'])
        setResearchDepth(1)
        break
      case 'deep':
        setSelectedAnalysts(['macro', 'market', 'news', 'social', 'fundamentals'])
        setResearchDepth(3)
        break
    }
  }

  const getEstimatedTime = () => {
    const baseTime = selectedAnalysts.length * 1.5 // 1.5 min per analyst
    const depthMultiplier = researchDepth
    const totalMinutes = Math.ceil(baseTime * depthMultiplier)
    return totalMinutes
  }

  const getDepthLabel = () => {
    switch (researchDepth) {
      case 1:
        return 'Basic'
      case 2:
        return 'Standard'
      case 3:
        return 'Deep'
      default:
        return 'Basic'
    }
  }

  const setQuickDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    setAnalysisDate(date.toISOString().split('T')[0])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ticker) {
      toast.error('Ticker is required')
      return
    }

    if (selectedAnalysts.length === 0) {
      toast.error('Select at least one analyst')
      return
    }

    // Show confirmation summary
    if (!showConfirm) {
      setShowConfirm(true)
      // Ensure user sees the confirmation and start button without manual scrolling
      setTimeout(() => {
        if (confirmSectionRef.current) {
          confirmSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        if (actionButtonsRef.current) {
          actionButtonsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 50)
      return
    }

    try {
      const analysis = await createMutation.mutateAsync({
        ticker: ticker.toUpperCase(),
        analysis_date: analysisDate,
        selected_analysts: selectedAnalysts,
        research_depth: researchDepth,
      })

      toast.success(`Analysis started: ${analysis.ticker}`)

      navigate(`/analyses/${analysis.id}`)
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail?.[0]?.msg || error.detail || 'Failed to create analysis'
      toast.error(errorMsg)
      setShowConfirm(false)
    }
  }

  const estimatedMinutes = getEstimatedTime()

  return (
    <form onSubmit={handleSubmit} className="max-w-[900px]">
      {/* Quick Presets */}
      <div className="mb-8">
        <div className="text-sm text-muted-foreground font-mono mb-3">
          QUICK PRESETS
        </div>
        <div className="flex gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => applyPreset('quick')}
            className="flex items-center gap-2 px-6 py-3 border border-border bg-transparent text-primary font-mono text-sm cursor-pointer transition-all hover:border-primary hover:bg-primary/10"
          >
            <Zap size={16} />
            <div className="text-left">
              <div className="font-bold">Quick Scan</div>
              <div className="text-xs text-muted-foreground">Market only • ~2 min</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className="flex items-center gap-2 px-6 py-3 border border-border bg-transparent text-blue-500 font-mono text-sm cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-500/10"
          >
            <Clock size={16} />
            <div className="text-left">
              <div className="font-bold">Standard</div>
              <div className="text-xs text-muted-foreground">4 analysts • ~6 min</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('deep')}
            className="flex items-center gap-2 px-6 py-3 border border-border bg-transparent text-primary font-mono text-sm cursor-pointer transition-all hover:border-primary hover:bg-primary/10"
          >
            <Search size={16} />
            <div className="text-left">
              <div className="font-bold">Deep Research</div>
              <div className="text-xs text-muted-foreground">5 analysts • ~15 min</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <ASCIIBox title="ANALYSIS CONFIGURATION">
        <div className="space-y-4">
          {/* Ticker Input with Quick Picks */}
          <div>
            <Input
              label="TICKER SYMBOL"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL, BTC, TSLA"
              required
              autoFocus
              aria-label="Ticker Symbol"
              className="border-primary focus:border-blue-500"
            />

            {/* Recent Tickers */}
            {recentTickers.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-muted-foreground mb-1">
                  Recent:
                </div>
                <div className="flex gap-2 flex-wrap">
                  {recentTickers.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTicker(t)}
                      className={`px-3 py-1 border font-mono text-xs cursor-pointer transition-all ${
                        ticker === t
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                          : 'border-border bg-transparent text-primary hover:border-primary'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Tickers */}
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">
                Popular:
              </div>
              <div className="flex gap-2 flex-wrap">
                {POPULAR_TICKERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTicker(t)}
                    className={`px-3 py-1 border font-mono text-xs cursor-pointer transition-all ${
                      ticker === t
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : 'border-border bg-transparent text-primary hover:border-primary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date Input with Quick Picks */}
          <div>
            <Input
              label="ANALYSIS DATE"
              type="date"
              value={analysisDate}
              onChange={(e) => setAnalysisDate(e.target.value)}
              required
              id="analysisDate"
              className="border-primary focus:border-blue-500 [color-scheme:dark] text-primary"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className="px-3 py-1 border border-border bg-transparent text-primary font-mono text-xs cursor-pointer hover:border-primary"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className="px-3 py-1 border border-border bg-transparent text-primary font-mono text-xs cursor-pointer hover:border-primary"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7)}
                className="px-3 py-1 border border-border bg-transparent text-primary font-mono text-xs cursor-pointer hover:border-primary"
              >
                Last Week
              </button>
            </div>
          </div>

          {/* Analysts Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-foreground font-mono text-sm">
                SELECT ANALYSTS ({selectedAnalysts.length}/{ANALYST_TYPES.length})
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 border border-border bg-transparent text-primary font-mono text-xs cursor-pointer hover:border-primary"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className="px-2 py-1 border border-border bg-transparent text-primary font-mono text-xs cursor-pointer hover:border-primary"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-2 border p-3">
              {ANALYST_TYPES.map((analyst) => (
                <div key={analyst} className="flex items-start gap-2">
                  <Checkbox
                    label={analyst.toUpperCase()}
                    checked={selectedAnalysts.includes(analyst)}
                    onChange={() => handleAnalystToggle(analyst)}
                  />
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {ANALYST_DESCRIPTIONS[analyst]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Depth */}
          <div>
            <label className="text-foreground font-mono text-sm mb-2 block">
              RESEARCH DEPTH: {getDepthLabel()} (Level {researchDepth})
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="3"
                value={researchDepth}
                onChange={(e) => setResearchDepth(Number(e.target.value))}
                className="w-full h-2 bg-muted border outline-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Basic
                  <br />
                  (1-2 min/analyst)
                </span>
                <span>
                  Standard
                  <br />
                  (2-3 min/analyst)
                </span>
                <span>
                  Deep
                  <br />
                  (4-5 min/analyst)
                </span>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="p-3 border border-blue-500/30 bg-blue-500/5 font-mono">
            <div className="text-xs text-muted-foreground mb-1">
              ESTIMATED COMPLETION TIME
            </div>
            <div className="text-xl text-blue-500 font-bold">
              ~{estimatedMinutes} minutes
            </div>
          </div>
        </div>
      </ASCIIBox>

      {/* Confirmation Summary */}
      {showConfirm && (
        <div className="mt-6" ref={confirmSectionRef}>
          <ASCIIBox title="CONFIRM ANALYSIS" variant="success">
            <div className="font-mono text-sm">
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <div className="text-muted-foreground">Ticker:</div>
                <div className="text-blue-500 font-bold">{ticker.toUpperCase()}</div>

                <div className="text-muted-foreground">Date:</div>
                <div className="text-primary">{analysisDate}</div>

                <div className="text-muted-foreground">Analysts:</div>
                <div className="text-primary">
                  {selectedAnalysts.map((a) => a.toUpperCase()).join(', ')} (
                  {selectedAnalysts.length})
                </div>

                <div className="text-muted-foreground">Research Depth:</div>
                <div className="text-primary">
                  {getDepthLabel()} (Level {researchDepth})
                </div>

                <div className="text-muted-foreground">Est. Time:</div>
                <div className="text-blue-500 font-bold">
                  ~{estimatedMinutes} minutes
                </div>
              </div>
            </div>
          </ASCIIBox>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4" ref={actionButtonsRef}>
        {!showConfirm ? (
          <>
            <Button type="submit">PREVIEW & CONFIRM</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/analyses')}>
              CANCEL
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'STARTING ANALYSIS...' : 'START ANALYSIS'}
            </Button>
            <Button type="button" onClick={() => setShowConfirm(false)}>
              BACK TO EDIT
            </Button>
          </>
        )}
      </div>
    </form>
  )
}
