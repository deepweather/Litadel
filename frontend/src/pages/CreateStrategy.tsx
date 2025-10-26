import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { KeyValueRow } from '../components/common/KeyValueRow'
import { PythonCodeEditor } from '../components/backtest/PythonCodeEditor'
import { DateInput, FormField, NumberInput, TextArea, TextInput } from '../components/ui/Form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { CreateBacktestRequest } from '../types/backtest'

export const CreateBacktest: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<CreateBacktestRequest>>({
    name: '',
    description: '',
    strategy_description: '',
    strategy_code_python: '',
    strategy_type: 'single_ticker',
    ticker_list: [],
    start_date: '',
    end_date: '',
    initial_capital: 100000,
    rebalance_frequency: 'weekly',
    position_sizing: 'equal_weight',
    max_positions: 10,
  })

  const createBacktestMutation = useMutation({
    mutationFn: (data: CreateBacktestRequest) => api.createBacktest(data),
    onSuccess: async (backtest) => {
      toast.success('Backtest created successfully! Click Execute to run it.')
      navigate(`/backtests/${backtest.id}`)
    },
    onError: (error: any) => {
      console.error('Backtest creation error:', error)

      // Handle validation errors (422)
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          // Pydantic validation errors
          const messages = error.detail.map((err: any) => {
            const field = err.loc?.join('.') || 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
          toast.error(`Validation error: ${messages}`)
        } else if (typeof error.detail === 'string') {
          toast.error(error.detail)
        } else {
          toast.error(JSON.stringify(error.detail))
        }
      } else {
        toast.error(error.message || 'Failed to create backtest')
      }
    },
  })

  const [isGenerating, setIsGenerating] = React.useState(false)
  const accumulatedCodeRef = React.useRef('')

  const handleGenerateCodeStream = async (ticker: string, description: string) => {
    setIsGenerating(true)

    try {
      toast('🤖 AI is generating your strategy code...', {
        icon: '✨',
        duration: 3000,
      })

      // Clear previous code and start streaming
      accumulatedCodeRef.current = ''
      setFormData(prev => ({ ...prev, strategy_code_python: '' }))

      console.log('🎬 Starting code generation...')

      const result = await api.generateStrategyCode({
        strategy_description: description,
        ticker: ticker,
        indicators: [],
        entry_conditions: {},
        exit_conditions: {},
        risk_params: {},
      }, (chunk) => {
        // Real-time update as chunks arrive
        console.log('📝 Received chunk:', chunk.substring(0, 50))
        accumulatedCodeRef.current += chunk
        setFormData(prev => ({
          ...prev,
          strategy_code_python: accumulatedCodeRef.current
        }))
      })

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          strategy_code_python: result.code,
        }))

        if (result.valid) {
          toast.success('✨ Strategy code generated successfully!')
        } else {
          toast.success(`✨ Strategy code generated (${result.validation_message})`)
        }
      } else {
        toast.error('Failed to generate strategy code')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate strategy code')
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name) {
      toast.error('Please provide a backtest name')
      return
    }
    if (!formData.strategy_description) {
      toast.error('Please provide a strategy description')
      return
    }

    // Check if this is an AI-managed strategy
    const isAIManaged = false  // No longer using AI_MANAGED universe in Python code

    if (!isAIManaged && (!formData.ticker_list || formData.ticker_list.length === 0)) {
      toast.error('Please specify at least one ticker, or use AI_MANAGED universe. Tip: Generate YAML in Step 2 to auto-extract tickers!')
      return
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please specify start and end dates in the Configuration step')
      return
    }
    if (!formData.initial_capital) {
      toast.error('Please specify initial capital in the Configuration step')
      return
    }

    // Ensure ticker_list is an array
    const requestData: CreateBacktestRequest = {
      ...formData,
      ticker_list: formData.ticker_list || [],
      strategy_code_python: formData.strategy_code_python || '',
      strategy_type: formData.strategy_type || 'single_ticker',
    } as CreateBacktestRequest

    createBacktestMutation.mutate(requestData)
  }

  const handleGenerateCode = () => {
    // Validate required fields before generation
    if (!formData.strategy_description) {
      toast.error('Please provide a strategy description first')
      return
    }

    // Try to extract ticker from description, or use a generic placeholder
    // Common patterns: "AAPL", "Apple", "Tesla", "TSLA", etc.
    let ticker = 'AAPL'  // Default
    const tickerPatterns = [
      { pattern: /\b(tsla|tesla)\b/i, ticker: 'TSLA' },
      { pattern: /\b(aapl|apple)\b/i, ticker: 'AAPL' },
      { pattern: /\b(msft|microsoft)\b/i, ticker: 'MSFT' },
      { pattern: /\b(googl|google|alphabet)\b/i, ticker: 'GOOGL' },
      { pattern: /\b(amzn|amazon)\b/i, ticker: 'AMZN' },
      { pattern: /\b(nvda|nvidia)\b/i, ticker: 'NVDA' },
      { pattern: /\b(meta|facebook)\b/i, ticker: 'META' },
      { pattern: /\b(btc|bitcoin)\b/i, ticker: 'BTC-USD' },
      { pattern: /\b(eth|ethereum)\b/i, ticker: 'ETH-USD' },
    ]

    for (const { pattern, ticker: t } of tickerPatterns) {
      if (pattern.test(formData.strategy_description)) {
        ticker = t
        break
      }
    }

    // Generate code with detected or default ticker
    handleGenerateCodeStream(ticker, formData.strategy_description)
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button onClick={() => navigate('/backtests')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary font-mono">
            CREATE BACKTEST
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            Step {step} of 4
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border p-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 ${s <= step ? 'bg-primary' : 'bg-primary/20'}`}
            />
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div style={{ border: '1px solid hsl(var(--border))', padding: '2rem' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="text-lg mb-4 text-primary font-mono font-bold">
              Basic Information
            </h2>

            <FormField label="NAME" required>
              <TextInput
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Trading Strategy"
              />
            </FormField>

            <FormField label="DESCRIPTION">
              <TextArea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of your backtest"
                rows={3}
              />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="text-lg mb-4 text-primary font-mono font-bold">
              Strategy Definition
            </h2>

            <FormField label="NATURAL LANGUAGE DESCRIPTION" required>
              <TextArea
                value={formData.strategy_description || ''}
                onChange={(e) => setFormData({ ...formData, strategy_description: e.target.value })}
                placeholder="Describe your trading strategy in plain English. Be as detailed as possible - an AI agent will interpret this to create your trading rules."
                rows={6}
              />
            </FormField>
            <Alert>
              <AlertTitle>💡 AI-Powered Strategy Generation</AlertTitle>
              <AlertDescription>
                Just describe your strategy and click "Generate YAML" - the AI will extract tickers from your description (e.g., "Tesla" → TSLA) and automatically fill in the Configuration step for you. No need to manually enter tickers twice!
                <br/><br/>
                <strong>Example:</strong> "I want to invest $50k in Tesla and Apple. Buy when the stock is oversold (RSI &lt; 30) and has positive news sentiment. Sell when RSI exceeds 70 or if there's negative news. Maximum 5 positions, equal weight, with a 10% stop-loss."
              </AlertDescription>
            </Alert>

            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <Button
                  onClick={handleGenerateCode}
                  disabled={isGenerating || !formData.strategy_description}
                  size="lg"
                  className="flex items-center gap-2 font-mono font-bold"
                >
                  <Sparkles size={20} />
                  <span>{isGenerating ? 'GENERATING CODE... 🔄' : 'GENERATE CODE ✨'}</span>
                </Button>
              </div>
              {!formData.strategy_description && (
                <div className="text-center text-sm text-muted-foreground mb-4">
                  👆 Fill in strategy description above to enable code generation
                </div>
              )}

              {/* Loading indicator overlay */}
              {isGenerating && (
                <div className="relative mb-2 p-4 border-2 border-blue-500 bg-blue-500/10 rounded flex items-center gap-3">
                  <div className="w-5 h-5 border-[3px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <div className="flex-1">
                    <div className="text-blue-500 font-bold mb-1">
                      🤖 AI is generating your Python strategy code...
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Watch the code appear in real-time below
                    </div>
                  </div>
                </div>
              )}

              {/* Strategy Code - Real-time streaming preview */}
              {formData.strategy_code_python && formData.strategy_code_python.trim().length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={20} className="text-primary" />
                    <h3 className="text-primary text-lg font-bold font-mono">
                      {isGenerating ? 'Generating Strategy Code... 🔄' : 'Generated Strategy Code ✨'}
                    </h3>
                  </div>
                  <PythonCodeEditor
                    code={formData.strategy_code_python}
                    onChange={(code) => setFormData(prev => ({ ...prev, strategy_code_python: code || '' }))}
                    height="500px"
                  />
                </div>
              ) : (
                <div style={{
                  marginTop: '1rem',
                  padding: '3rem 2rem',
                  border: '2px dashed hsl(var(--primary))',
                  borderRadius: '8px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0, 212, 255, 0.05)',
                }}>
                  <Sparkles size={48} className="text-accent mx-auto mb-4" />
                  <p className="text-accent text-base font-bold mb-2">
                    No Strategy Code Generated Yet
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Click the "GENERATE CODE ✨" button above to create your Python strategy from your description
                  </p>
                </div>
              )}

              {/* Add CSS animations */}
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                  0%, 100% { opacity: 0.3; transform: scale(0.8); }
                  50% { opacity: 1; transform: scale(1.2); }
                }
              `}</style>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2
              className="text-lg mb-4 text-primary font-mono"
              style={{
                fontWeight: 'bold',
              }}
            >
              Configuration
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <FormField label="START DATE" required>
                <DateInput
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </FormField>

              <FormField label="END DATE" required>
                <DateInput
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="INITIAL CAPITAL" required>
              <NumberInput
                value={formData.initial_capital || ''}
                onChange={(e) => setFormData({ ...formData, initial_capital: parseFloat(e.target.value) })}
                placeholder="100000"
                step="1000"
                min="1000"
              />
            </FormField>

            <FormField label="TICKER LIST">
              <TextInput
                value={formData.ticker_list?.join(', ') || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ticker_list: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="Leave empty for random ticker selection, or enter: AAPL, TSLA, NVDA"
              />
            </FormField>
            <Alert>
              <AlertTitle>🎲 Random Portfolio Mode</AlertTitle>
              <AlertDescription>
                Leave this field empty to enable random mode. The system will randomly select 3-10 tickers from a curated pool of 50+ stocks, cryptocurrencies, and commodities, generating realistic trades with actual historical prices.
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTitle>⚠️ Ticker Format</AlertTitle>
              <AlertDescription>
                Make sure tickers existed during your selected date range.
                <br />
                • Stocks: AAPL, TSLA (no suffix)
                <br />
                • Crypto: BTC-USD, ETH-USD (with -USD suffix)
                <br />
                • Commodities: BRENT, WTI (no suffix)
              </AlertDescription>
            </Alert>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <FormField label="REBALANCE FREQUENCY">
                <select
                  value={formData.rebalance_frequency || 'weekly'}
                  onChange={(e) => setFormData({ ...formData, rebalance_frequency: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#1a2a3a',
                    border: '1px solid #4da6ff',
                    color: '#fff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </FormField>

              <FormField label="POSITION SIZING">
                <select
                  value={formData.position_sizing || 'equal_weight'}
                  onChange={(e) => setFormData({ ...formData, position_sizing: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#1a2a3a',
                    border: '1px solid #4da6ff',
                    color: '#fff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="equal_weight">Equal Weight</option>
                  <option value="risk_parity">Risk Parity</option>
                  <option value="kelly">Kelly Criterion</option>
                </select>
              </FormField>
            </div>

            <FormField label={`MAX POSITIONS: ${formData.max_positions || 10}`}>
              <input
                type="range"
                min="1"
                max="20"
                value={formData.max_positions || 10}
                onChange={(e) => setFormData({ ...formData, max_positions: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </FormField>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2
              className="text-lg mb-4 text-primary font-mono"
              style={{
                fontWeight: 'bold',
              }}
            >
              Review & Submit
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <KeyValueRow
                label="NAME"
                value={formData.name || ''}
                labelColor="#2a3e4a"
                valueColor="#fff"
              />

              {formData.description && (
                <KeyValueRow
                  label="DESCRIPTION"
                  value={formData.description}
                  labelColor="#2a3e4a"
                  valueColor="#fff"
                />
              )}

              <KeyValueRow
                label="TICKERS"
                value={formData.ticker_list?.join(', ') || ''}
                labelColor="#2a3e4a"
                valueColor="#fff"
              />

              <KeyValueRow
                label="DATE RANGE"
                value={`${formData.start_date} to ${formData.end_date}`}
                labelColor="#2a3e4a"
                valueColor="#fff"
              />

              <KeyValueRow
                label="INITIAL CAPITAL"
                value={`$${formData.initial_capital?.toLocaleString()}`}
                labelColor="#2a3e4a"
                valueColor="#fff"
              />

              <KeyValueRow
                label="CONFIGURATION"
                value={`${formData.rebalance_frequency} rebalancing, ${formData.position_sizing} sizing, max ${formData.max_positions} positions`}
                labelColor="#2a3e4a"
                valueColor="#fff"
                divider={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={handlePrev}
          disabled={step === 1}
          style={{
            opacity: step === 1 ? 0.5 : 1,
            cursor: step === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ArrowLeft size={18} />
          <span>PREVIOUS</span>
        </Button>

        {step < 4 ? (
          <Button onClick={handleNext}>
            <span>NEXT</span>
            <ArrowRight size={18} />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createBacktestMutation.isPending}>
            <Check size={18} />
            <span>{createBacktestMutation.isPending ? 'CREATING...' : 'CREATE BACKTEST'}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

