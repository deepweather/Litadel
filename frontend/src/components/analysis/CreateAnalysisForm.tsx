import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyses, useCreateAnalysis } from '../../hooks/useAnalyses'
import { useAnalysisDefaults } from '../../hooks/useAnalysisDefaults'
import { ANALYST_TYPES, type AnalystType } from '../../types/analysis'
import { Button } from '@/components/ui/button'
import { FormInput as Input } from '@/components/ui/form-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, RotateCcw, Save, Search, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { TickerPill } from './TickerPill'
import { PresetCard } from './PresetCard'
import { AnalystSelectionCard } from './AnalystSelectionCard'
import { LivePreviewSidebar } from './LivePreviewSidebar'
import { FormProgressIndicator } from './FormProgressIndicator'

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
  const { data: analysesData, isLoading: isLoadingAnalyses } = useAnalyses()
  const { defaults, saveDefaults, hasDefaults } = useAnalysisDefaults()

  const [ticker, setTicker] = useState(initialTicker || '')
  const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedAnalysts, setSelectedAnalysts] = useState<AnalystType[]>([
    'macro',
    'market',
    'news',
    'social',
  ])
  const [researchDepth, setResearchDepth] = useState(1)
  const [activePreset, setActivePreset] = useState<Preset | null>(null)

  // Apply saved defaults on mount if available
  useEffect(() => {
    if (defaults && !initialTicker) {
      setSelectedAnalysts(defaults.selectedAnalysts)
      setResearchDepth(defaults.researchDepth)
    }
  }, [defaults, initialTicker])

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
    setActivePreset(null) // Clear preset when manually changing
  }

  const handleSelectAll = () => {
    setSelectedAnalysts([...ANALYST_TYPES])
    setActivePreset(null)
  }

  const handleSelectNone = () => {
    setSelectedAnalysts([])
    setActivePreset(null)
  }

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset)
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

  const handleSaveAsDefault = () => {
    saveDefaults({
      selectedAnalysts,
      researchDepth,
    })
    toast.success('Configuration saved as default')
  }

  const handleSubmit = async () => {
    if (!ticker) {
      toast.error('Ticker is required')
      return
    }

    if (selectedAnalysts.length === 0) {
      toast.error('Select at least one analyst')
      return
    }

    try {
      // Save successful configuration as default
      saveDefaults({
        selectedAnalysts,
        researchDepth,
      })

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
    }
  }

  const estimatedMinutes = getEstimatedTime()
  const isValid = Boolean(ticker && selectedAnalysts.length > 0)

  // Calculate progress steps
  const progressSteps = [
    { label: 'Ticker selected', completed: Boolean(ticker) },
    { label: 'Date selected', completed: Boolean(analysisDate) },
    { label: 'Analysts selected', completed: selectedAnalysts.length > 0 },
    { label: 'Research depth set', completed: true }, // Always has default
  ]

  const completedSteps = progressSteps.filter(s => s.completed).length
  const completionPercentage = Math.round((completedSteps / progressSteps.length) * 100)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Main Form Column */}
      <div className="space-y-4">
        {/* Progress Indicator - Mobile Only */}
        <div className="lg:hidden">
          <FormProgressIndicator steps={progressSteps} />
        </div>
        {/* Quick Presets */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Quick Presets</CardTitle>
                <CardDescription className="text-xs">Start with a pre-configured analysis</CardDescription>
              </div>
              {hasDefaults && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (defaults) {
                      setSelectedAnalysts(defaults.selectedAnalysts)
                      setResearchDepth(defaults.researchDepth)
                      setActivePreset(null)
                      toast.success('Loaded your saved configuration')
                    }
                  }}
                >
                  <RotateCcw size={14} />
                  Load Last Used
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
              <PresetCard
                icon={Zap}
                title="Quick Scan"
                description="Market only • ~2 min"
                onClick={() => applyPreset('quick')}
                variant="primary"
                isLoading={activePreset === 'quick' && createMutation.isPending}
              />
              <PresetCard
                icon={Clock}
                title="Standard"
                description="4 analysts • ~6 min"
                onClick={() => applyPreset('standard')}
                variant="default"
                isLoading={activePreset === 'standard' && createMutation.isPending}
              />
              <PresetCard
                icon={Search}
                title="Deep Research"
                description="5 analysts • ~15 min"
                onClick={() => applyPreset('deep')}
                variant="accent"
                isLoading={activePreset === 'deep' && createMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Asset Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Asset Selection</CardTitle>
            <CardDescription className="text-xs">Choose the ticker and analysis date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            {/* Ticker Input */}
            <div>
              <Input
                label="TICKER SYMBOL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, BTC, TSLA"
                required
                autoFocus
                aria-label="Ticker Symbol"
              />

              {/* Recent Tickers */}
              {isLoadingAnalyses ? (
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-6 w-14" />
                    <Skeleton className="h-6 w-14" />
                    <Skeleton className="h-6 w-14" />
                  </div>
                </div>
              ) : (
                recentTickers.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[10px] text-muted-foreground mb-1.5 font-mono">Recent:</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {recentTickers.map((t) => (
                        <TickerPill
                          key={t}
                          ticker={t}
                          selected={ticker === t}
                          onClick={() => setTicker(t)}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Popular Tickers */}
              <div className="mt-2">
                <div className="text-[10px] text-muted-foreground mb-1.5 font-mono">Popular:</div>
                <div className="flex gap-1.5 flex-wrap">
                  {POPULAR_TICKERS.map((t) => (
                    <TickerPill
                      key={t}
                      ticker={t}
                      selected={ticker === t}
                      onClick={() => setTicker(t)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Date Input */}
            <div>
              <Input
                label="ANALYSIS DATE"
                type="date"
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
                required
                id="analysisDate"
                className="[color-scheme:dark]"
              />
              <div className="mt-2 flex gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDate(0)}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDate(1)}
                >
                  Yesterday
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDate(7)}
                >
                  Last Week
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analyst Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Analyst Configuration</CardTitle>
                <CardDescription className="text-xs">
                  Select analysts ({selectedAnalysts.length}/{ANALYST_TYPES.length})
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectNone}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {ANALYST_TYPES.map((analyst) => (
                <AnalystSelectionCard
                  key={analyst}
                  analystType={analyst}
                  description={ANALYST_DESCRIPTIONS[analyst]}
                  selected={selectedAnalysts.includes(analyst)}
                  onToggle={() => handleAnalystToggle(analyst)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Research Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Research Parameters</CardTitle>
                <CardDescription className="text-xs">
                  Depth: {getDepthLabel()} (Level {researchDepth})
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSaveAsDefault}
              >
                <Save size={14} />
                Save as Default
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            <div className="space-y-2">
              <Slider
                value={[researchDepth]}
                onValueChange={(value: number[]) => {
                  setResearchDepth(value[0])
                  setActivePreset(null)
                }}
                min={1}
                max={3}
                step={1}
                className="w-full"
              />
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-mono">
                <div className="text-center">
                  <div className="font-bold">Basic</div>
                  <div>1-2 min/analyst</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">Standard</div>
                  <div>2-3 min/analyst</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">Deep</div>
                  <div>4-5 min/analyst</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons (Mobile Only) */}
        <div className="flex gap-3 lg:hidden">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createMutation.isPending}
            className="flex-1"
            size="lg"
          >
            {createMutation.isPending ? 'STARTING ANALYSIS...' : 'START ANALYSIS'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/analyses')}
            size="lg"
          >
            CANCEL
          </Button>
        </div>
      </div>

      {/* Live Preview Sidebar - Desktop Only */}
      <div className="hidden lg:block">
        <LivePreviewSidebar
          ticker={ticker}
          analysisDate={analysisDate}
          selectedAnalysts={selectedAnalysts}
          researchDepth={researchDepth}
          estimatedMinutes={estimatedMinutes}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          isValid={isValid}
          completionPercentage={completionPercentage}
        />
      </div>
    </div>
  )
}
