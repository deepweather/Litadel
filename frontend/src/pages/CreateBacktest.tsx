import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '../components/ui/Button'
import { KeyValueRow } from '../components/common/KeyValueRow'
import { StrategyVisualizer } from '../components/backtest/StrategyVisualizer'
import { DateInput, FormField, NumberInput, TextArea, TextInput } from '../components/ui/Form'
import { InfoBanner } from '../components/ui/InfoBanner'
import type { CreateBacktestRequest } from '../types/backtest'

export const CreateBacktest: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<CreateBacktestRequest>>({
    name: '',
    description: '',
    strategy_description: '',
    strategy_dsl_yaml: '',
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
      toast.success('Backtest created successfully')

      // Automatically trigger execution
      try {
        await api.executeBacktest(backtest.id)
        toast.success('Backtest execution started')
      } catch (error: any) {
        const errorMsg = error.detail || error.message || 'Failed to start backtest execution'
        toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
      }

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
  const accumulatedYamlRef = React.useRef('')

  const handleGenerateYAMLStream = async (data: {
    strategy_description: string
    ticker_list: string[]
    initial_capital: number
    rebalance_frequency: string
    position_sizing: string
    max_positions: number
  }) => {
    setIsGenerating(true)

    try {
      toast('🤖 AI is generating your strategy YAML...', {
        icon: '✨',
        duration: 3000,
      })

      // Clear previous YAML and start streaming
      accumulatedYamlRef.current = ''
      setFormData(prev => ({ ...prev, strategy_dsl_yaml: '' }))

      console.log('🎬 Starting YAML generation...')

      const result = await api.generateStrategyDSL(data, (chunk) => {
        // Real-time update as chunks arrive
        console.log('📝 Received chunk:', chunk.substring(0, 50))
        accumulatedYamlRef.current += chunk
        setFormData(prev => ({
          ...prev,
          strategy_dsl_yaml: accumulatedYamlRef.current
        }))
      })

      if (result.success) {
        // Parse the YAML to extract tickers and auto-populate ticker_list
        const extractedTickers = extractTickersFromYAML(result.yaml_dsl)

        setFormData(prev => ({
          ...prev,
          strategy_dsl_yaml: result.yaml_dsl,
          // Auto-populate ticker list from generated YAML if user hasn't specified any
          ticker_list: data.ticker_list && data.ticker_list.length > 0
            ? data.ticker_list
            : extractedTickers
        }))

        if (extractedTickers.length > 0) {
          toast.success(`✨ Strategy YAML generated! Auto-detected tickers: ${extractedTickers.join(', ')}`)
        } else if (result.yaml_dsl.includes('AI_MANAGED')) {
          toast.success('✨ Strategy YAML generated! AI will manage asset selection 🤖')
        } else if (result.valid) {
          toast.success('✨ Strategy YAML generated successfully!')
        } else {
          toast.success(`✨ Strategy YAML generated (${result.validation_message})`)
        }
      } else {
        toast.error('Failed to generate strategy YAML')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate strategy YAML')
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const extractTickersFromYAML = (yamlString: string): string[] => {
    try {
      // Check for AI_MANAGED universe first
      const aiManagedMatch = yamlString.match(/universe:\s*["']?AI_MANAGED["']?/i)
      if (aiManagedMatch) {
        console.log('🤖 AI-managed universe detected - no specific tickers')
        return [] // AI will select assets dynamically
      }

      // Simple regex-based extraction of tickers from universe field
      // Matches patterns like: universe: [AAPL, TSLA] or universe:\n  - AAPL
      const universeMatch = yamlString.match(/universe:\s*\[(.*?)\]/s)
      if (universeMatch) {
        // Array format: [AAPL, TSLA, ...]
        return universeMatch[1]
          .split(',')
          .map(ticker => ticker.trim().replace(/['"]/g, ''))
          .filter(Boolean)
      }

      // Try list format: universe:\n  - AAPL\n  - TSLA
      const listMatches = yamlString.match(/universe:\s*\n((?:\s*-\s*[A-Z0-9-]+\s*\n)+)/i)
      if (listMatches) {
        const tickers = listMatches[1]
          .split('\n')
          .map(line => line.trim().replace(/^-\s*/, '').replace(/['"]/g, ''))
          .filter(Boolean)
        return tickers
      }

      return []
    } catch (e) {
      console.error('Failed to extract tickers from YAML:', e)
      return []
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
    const isAIManaged = formData.strategy_dsl_yaml?.includes('AI_MANAGED')

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

    // Ensure ticker_list is an array (even if empty for AI_MANAGED)
    const requestData: CreateBacktestRequest = {
      ...formData,
      ticker_list: formData.ticker_list || [],
      strategy_dsl_yaml: formData.strategy_dsl_yaml || '',
    } as CreateBacktestRequest

    createBacktestMutation.mutate(requestData)
  }

  const handleGenerateYAML = () => {
    // Validate required fields before generation
    if (!formData.strategy_description) {
      toast.error('Please provide a strategy description first')
      return
    }

    // Generate the YAML using the LLM agent (with streaming!)
    // If tickers aren't specified yet, the LLM will extract them from the description
    handleGenerateYAMLStream({
      strategy_description: formData.strategy_description,
      ticker_list: formData.ticker_list && formData.ticker_list.length > 0 ? formData.ticker_list : [],
      initial_capital: formData.initial_capital || 100000,
      rebalance_frequency: formData.rebalance_frequency || 'weekly',
      position_sizing: formData.position_sizing || 'equal_weight',
      max_positions: formData.max_positions || 10,
    })
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button onClick={() => navigate('/backtests')} style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#4da6ff',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            CREATE BACKTEST
          </h1>
          <p
            style={{
              color: '#2a3e4a',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.875rem',
            }}
          >
            Step {step} of 4
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: s <= step ? '#4da6ff' : 'rgba(77, 166, 255, 0.2)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div style={{ border: '1px solid rgba(77, 166, 255, 0.3)', padding: '2rem' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.125rem',
                marginBottom: '1rem',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 'bold',
              }}
            >
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
            <h2
              style={{
                fontSize: '1.125rem',
                marginBottom: '1rem',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 'bold',
              }}
            >
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
            <InfoBanner variant="info" icon="💡" title="AI-Powered Strategy Generation">
              Just describe your strategy and click "Generate YAML" - the AI will extract tickers from your description (e.g., "Tesla" → TSLA) and automatically fill in the Configuration step for you. No need to manually enter tickers twice!
              <br/><br/>
              <strong>Example:</strong> "I want to invest $50k in Tesla and Apple. Buy when the stock is oversold (RSI &lt; 30) and has positive news sentiment. Sell when RSI exceeds 70 or if there's negative news. Maximum 5 positions, equal weight, with a 10% stop-loss."
            </InfoBanner>

            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <button
                  onClick={handleGenerateYAML}
                  disabled={isGenerating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    border: '2px solid #00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    color: '#00d4ff',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    opacity: isGenerating ? 0.6 : 1,
                    borderRadius: '8px',
                  }}
                >
                  <Sparkles size={20} />
                  <span>{isGenerating ? 'GENERATING STRATEGY... 🔄' : 'GENERATE STRATEGY ✨'}</span>
                </button>
              </div>

              {/* Loading indicator overlay */}
              {isGenerating && (
                <div style={{
                  position: 'relative',
                  marginBottom: '0.5rem',
                  padding: '1rem',
                  border: '2px solid #00d4ff',
                  backgroundColor: 'rgba(0, 212, 255, 0.1)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid rgba(0, 212, 255, 0.3)',
                    borderTop: '3px solid #00d4ff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#00d4ff', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      🤖 AI is generating your strategy...
                    </div>
                    <div style={{ color: '#2a3e4a', fontSize: '0.75rem' }}>
                      Watch the YAML appear in real-time below
                    </div>
                  </div>
                </div>
              )}

              {/* Strategy Visualization - Real-time streaming preview */}
              {formData.strategy_dsl_yaml && formData.strategy_dsl_yaml.trim().length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{
                    color: '#00d4ff',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <Sparkles size={20} />
                    {isGenerating ? 'Generating Strategy... 🔄' : 'Generated Strategy ✨'}
                  </h3>
                  <StrategyVisualizer yamlContent={formData.strategy_dsl_yaml} />
                </div>
              ) : (
                <div style={{
                  marginTop: '1rem',
                  padding: '3rem 2rem',
                  border: '2px dashed #4da6ff',
                  borderRadius: '8px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0, 212, 255, 0.05)',
                }}>
                  <Sparkles size={48} style={{ color: '#00d4ff', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#00d4ff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    No Strategy Generated Yet
                  </p>
                  <p style={{ color: '#8899aa', fontSize: '0.875rem' }}>
                    Click the "GENERATE YAML ✨" button above to create your strategy from your description
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
              style={{
                fontSize: '1.125rem',
                marginBottom: '1rem',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
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
            <InfoBanner variant="success" icon="🎲" title="Random Portfolio Mode">
              Leave this field empty to enable random mode. The system will randomly select 3-10 tickers from a curated pool of 50+ stocks, cryptocurrencies, and commodities, generating realistic trades with actual historical prices.
            </InfoBanner>
            <InfoBanner variant="warning" icon="⚠️" title="Ticker Format">
              Make sure tickers existed during your selected date range.
              <br />
              • Stocks: AAPL, TSLA (no suffix)
              <br />
              • Crypto: BTC-USD, ETH-USD (with -USD suffix)
              <br />
              • Commodities: BRENT, WTI (no suffix)
            </InfoBanner>

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
              style={{
                fontSize: '1.125rem',
                marginBottom: '1rem',
                color: '#4da6ff',
                fontFamily: 'JetBrains Mono, monospace',
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
                style={{ paddingBottom: '0.5rem' }}
              />

              {formData.description && (
                <KeyValueRow
                  label="DESCRIPTION"
                  value={formData.description}
                  labelColor="#2a3e4a"
                  valueColor="#fff"
                  style={{ paddingBottom: '0.5rem' }}
                />
              )}

              <KeyValueRow
                label="TICKERS"
                value={formData.ticker_list?.join(', ') || ''}
                labelColor="#2a3e4a"
                valueColor="#fff"
                style={{ paddingBottom: '0.5rem' }}
              />

              <KeyValueRow
                label="DATE RANGE"
                value={`${formData.start_date} to ${formData.end_date}`}
                labelColor="#2a3e4a"
                valueColor="#fff"
                style={{ paddingBottom: '0.5rem' }}
              />

              <KeyValueRow
                label="INITIAL CAPITAL"
                value={`$${formData.initial_capital?.toLocaleString()}`}
                labelColor="#2a3e4a"
                valueColor="#fff"
                style={{ paddingBottom: '0.5rem' }}
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

