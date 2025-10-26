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
      toast.error('Ticker is required', {
        style: {
          background: '#1a2a3a',
          color: '#ff4444',
          border: '1px solid #ff4444',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })
      return
    }

    if (selectedAnalysts.length === 0) {
      toast.error('Select at least one analyst', {
        style: {
          background: '#1a2a3a',
          color: '#ff4444',
          border: '1px solid #ff4444',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })
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

      toast.success(`Analysis started: ${analysis.ticker}`, {
        style: {
          background: '#1a2a3a',
          color: '#4da6ff',
          border: '1px solid #4da6ff',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })

      navigate(`/analyses/${analysis.id}`)
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail?.[0]?.msg || error.detail || 'Failed to create analysis'
      toast.error(errorMsg, {
        style: {
          background: '#1a2a3a',
          color: '#ff4444',
          border: '1px solid #ff4444',
          fontFamily: 'JetBrains Mono, monospace',
        },
      })
      setShowConfirm(false)
    }
  }

  const estimatedMinutes = getEstimatedTime()

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}>
      {/* Quick Presets */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            fontSize: '0.875rem',
            color: '#5a6e7a',
            fontFamily: 'JetBrains Mono, monospace',
            marginBottom: '0.75rem',
          }}
        >
          QUICK PRESETS
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => applyPreset('quick')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              border: '1px solid rgba(77, 166, 255, 0.3)',
              backgroundColor: 'transparent',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4da6ff'
              e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Zap size={16} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold' }}>Quick Scan</div>
              <div style={{ fontSize: '0.7rem', color: '#5a6e7a' }}>Market only • ~2 min</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('standard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              border: '1px solid rgba(77, 166, 255, 0.3)',
              backgroundColor: 'transparent',
              color: '#00d4ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00d4ff'
              e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Clock size={16} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold' }}>Standard</div>
              <div style={{ fontSize: '0.7rem', color: '#5a6e7a' }}>4 analysts • ~6 min</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('deep')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              border: '1px solid rgba(77, 166, 255, 0.3)',
              backgroundColor: 'transparent',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4da6ff'
              e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Search size={16} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold' }}>Deep Research</div>
              <div style={{ fontSize: '0.7rem', color: '#5a6e7a' }}>5 analysts • ~15 min</div>
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
              style={{ border: '1px solid #4da6ff' }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid #00d4ff'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid #4da6ff'
              }}
            />

            {/* Recent Tickers */}
            {recentTickers.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#5a6e7a', marginBottom: '0.25rem' }}>
                  Recent:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {recentTickers.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTicker(t)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        border: '1px solid rgba(77, 166, 255, 0.3)',
                        backgroundColor: ticker === t ? 'rgba(77, 166, 255, 0.1)' : 'transparent',
                        color: ticker === t ? '#00d4ff' : '#4da6ff',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Tickers */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#5a6e7a', marginBottom: '0.25rem' }}>
                Popular:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {POPULAR_TICKERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTicker(t)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      border: '1px solid rgba(77, 166, 255, 0.3)',
                      backgroundColor: ticker === t ? 'rgba(77, 166, 255, 0.1)' : 'transparent',
                      color: ticker === t ? '#00d4ff' : '#4da6ff',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
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
              style={{
                border: '1px solid #4da6ff',
                colorScheme: 'dark',
                color: '#4da6ff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid #00d4ff'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid #4da6ff'
              }}
            />
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                style={{
                  padding: '0.25rem 0.75rem',
                  border: '1px solid rgba(77, 166, 255, 0.3)',
                  backgroundColor: 'transparent',
                  color: '#4da6ff',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                style={{
                  padding: '0.25rem 0.75rem',
                  border: '1px solid rgba(77, 166, 255, 0.3)',
                  backgroundColor: 'transparent',
                  color: '#4da6ff',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7)}
                style={{
                  padding: '0.25rem 0.75rem',
                  border: '1px solid rgba(77, 166, 255, 0.3)',
                  backgroundColor: 'transparent',
                  color: '#4da6ff',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Last Week
              </button>
            </div>
          </div>

          {/* Analysts Selection */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <label className="text-terminal-fg font-mono text-sm">
                SELECT ANALYSTS ({selectedAnalysts.length}/{ANALYST_TYPES.length})
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid rgba(77, 166, 255, 0.3)',
                    backgroundColor: 'transparent',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleSelectNone}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid rgba(77, 166, 255, 0.3)',
                    backgroundColor: 'transparent',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-2 border border-terminal-border p-3">
              {ANALYST_TYPES.map((analyst) => (
                <div key={analyst} style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                  <Checkbox
                    label={analyst.toUpperCase()}
                    checked={selectedAnalysts.includes(analyst)}
                    onChange={() => handleAnalystToggle(analyst)}
                  />
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#5a6e7a',
                      marginTop: '0.25rem',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {ANALYST_DESCRIPTIONS[analyst]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Depth */}
          <div>
            <label className="text-terminal-fg font-mono text-sm mb-2 block">
              RESEARCH DEPTH: {getDepthLabel()} (Level {researchDepth})
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="3"
                value={researchDepth}
                onChange={(e) => setResearchDepth(Number(e.target.value))}
                className="w-full h-2 bg-terminal-highlight border border-terminal-border outline-none slider"
              />
              <div className="flex justify-between text-xs text-terminal-dim">
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
          <div
            style={{
              padding: '0.75rem',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              backgroundColor: 'rgba(0, 212, 255, 0.05)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#5a6e7a', marginBottom: '0.25rem' }}>
              ESTIMATED COMPLETION TIME
            </div>
            <div style={{ fontSize: '1.25rem', color: '#00d4ff', fontWeight: 'bold' }}>
              ~{estimatedMinutes} minutes
            </div>
          </div>
        </div>
      </ASCIIBox>

      {/* Confirmation Summary */}
      {showConfirm && (
        <div style={{ marginTop: '1.5rem' }} ref={confirmSectionRef}>
          <ASCIIBox title="CONFIRM ANALYSIS" variant="success">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.5rem' }}>
                <div style={{ color: '#5a6e7a' }}>Ticker:</div>
                <div style={{ color: '#00d4ff', fontWeight: 'bold' }}>{ticker.toUpperCase()}</div>

                <div style={{ color: '#5a6e7a' }}>Date:</div>
                <div style={{ color: '#4da6ff' }}>{analysisDate}</div>

                <div style={{ color: '#5a6e7a' }}>Analysts:</div>
                <div style={{ color: '#4da6ff' }}>
                  {selectedAnalysts.map((a) => a.toUpperCase()).join(', ')} (
                  {selectedAnalysts.length})
                </div>

                <div style={{ color: '#5a6e7a' }}>Research Depth:</div>
                <div style={{ color: '#4da6ff' }}>
                  {getDepthLabel()} (Level {researchDepth})
                </div>

                <div style={{ color: '#5a6e7a' }}>Est. Time:</div>
                <div style={{ color: '#00d4ff', fontWeight: 'bold' }}>
                  ~{estimatedMinutes} minutes
                </div>
              </div>
            </div>
          </ASCIIBox>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }} ref={actionButtonsRef}>
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
