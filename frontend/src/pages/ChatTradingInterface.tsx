import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, Send, Sparkles } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { ChatMessage } from '../components/trading/ChatMessage'
import { ParameterApprovalCard } from '../components/trading/ParameterApprovalCard'
import { ClarificationForm } from '../components/trading/ClarificationForm'
import { StrategyVisualizer } from '../components/backtest/StrategyVisualizer'
import type { ConversationState, ExtractedParameters, Message } from '../types/trading'

export const ChatTradingInterface: React.FC = () => {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [state, setState] = useState<ConversationState>({
    messages: [
      {
        role: 'assistant',
        content: 'Hi! I\'ll help you create a backtest or analyze assets. I support two strategy types:\n\n🤖 **Agent-Managed**: High-level preferences, AI manages trades\n   Example: "I like crypto and tech stocks, I\'m aggressive with $50k"\n\n📊 **Technical DSL**: Specific rules with indicators & thresholds\n   Example: "Buy AAPL when RSI < 30 and MACD crosses, sell at 10% profit or 5% stop-loss"\n\n💡 **Analysis**:\n   Example: "What do you think about Bitcoin?"',
        timestamp: new Date()
      }
    ],
    extractedParams: {},
    pendingApproval: false,
    pendingClarification: null,
    isProcessing: false
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.pendingApproval, state.pendingClarification])

  const addMessage = (role: Message['role'], content: string) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, { role, content, timestamp: new Date() }]
    }))
  }

  const handleSendMessage = async () => {
    if (!input.trim() || state.isProcessing) return

    const userMessage = input.trim()
    setInput('')
    addMessage('user', userMessage)

    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      // Extract parameters from natural language
      const response = await api.extractTradingParameters({
        user_message: userMessage,
        conversation_history: state.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })

      // Update extracted parameters
      setState(prev => ({
        ...prev,
        extractedParams: {
          ...prev.extractedParams,
          ...response.extracted,
          intent: response.intent as any
        },
        isProcessing: false
      }))

      // Generate assistant response
      let assistantMessage = ''

      if (Object.keys(response.extracted).length > 0) {
        assistantMessage += '✅ Great! I\'ve extracted the following:\n\n'
        Object.entries(response.extracted).forEach(([key, value]) => {
          const confidence = response.confidence[key] || 1.0
          const icon = confidence > 0.8 ? '✓' : '⚠️'
          const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
          assistantMessage += `${icon} **${key.replace(/_/g, ' ')}**: ${displayValue}\n`
        })
      }

      addMessage('assistant', assistantMessage)

      // Check if we need clarification
      if (response.needs_clarification && response.clarification_questions.length > 0) {
        setState(prev => ({
          ...prev,
          pendingClarification: {
            questions: response.clarification_questions,
            currentIndex: 0
          }
        }))
      } else if (response.missing.length === 0) {
        // All required fields collected - ALWAYS generate DSL
        const strategyType = state.extractedParams.strategy_type || response.extracted.strategy_type

        if (strategyType === 'technical_dsl') {
          addMessage('assistant', '🎉 All information collected! Generating your technical strategy DSL...')
        } else {
          addMessage('assistant', '🎉 All information collected! Generating your AI-managed strategy DSL...')
        }

        // Always generate YAML DSL for visualization and approval
        await generateYAMLForApproval()
      } else {
        // Still missing some fields
        addMessage('assistant', `📝 Still need: ${response.missing.join(', ')}`)
        setState(prev => ({
          ...prev,
          pendingClarification: {
            questions: response.clarification_questions,
            currentIndex: 0
          }
        }))
      }

    } catch (error: any) {
      setState(prev => ({ ...prev, isProcessing: false }))
      toast.error(error.message || 'Failed to process message')
      addMessage('assistant', '❌ Sorry, I encountered an error. Please try again or rephrase your request.')
    }
  }

  const generateYAMLForApproval = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }))

      const yamlResult = await api.generateStrategyDSL({
        strategy_description: state.extractedParams.strategy_description || '',
        ticker_list: state.extractedParams.ticker_list || [],
        initial_capital: state.extractedParams.capital || 100000,
        rebalance_frequency: state.extractedParams.rebalance_frequency || 'weekly',
        position_sizing: state.extractedParams.position_sizing || 'equal_weight',
        max_positions: state.extractedParams.max_positions || 10,
        strategy_type: state.extractedParams.strategy_type || 'agent_managed',
      })

      if (yamlResult.success) {
        setState(prev => ({
          ...prev,
          generatedYaml: yamlResult.yaml_dsl,
          isProcessing: false,
          pendingApproval: true
        }))
        addMessage('assistant', '✅ Strategy DSL generated! Review the visualization below and approve to proceed:')
      } else {
        setState(prev => ({ ...prev, isProcessing: false }))
        addMessage('assistant', '⚠️ Failed to generate strategy DSL. Please try describing your strategy again.')
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, isProcessing: false }))
      toast.error(error.message || 'Failed to generate YAML')
      addMessage('assistant', '❌ Error generating strategy DSL. Please try again.')
    }
  }

  const handleClarificationSubmit = async (answers: Record<string, any>) => {
    // Merge answers with extracted params
    const mergedParams = {
      ...state.extractedParams,
      ...answers
    }

    setState(prev => ({
      ...prev,
      extractedParams: mergedParams,
      pendingClarification: null,
      isProcessing: true
    }))

    // Create message showing what was filled in
    const message = Object.entries(answers)
      .map(([key, value]) => {
        const label = key.replace(/_/g, ' ')
        const formatted = Array.isArray(value)
          ? value.join(', ')
          : typeof value === 'number' && key === 'capital'
            ? `$${value.toLocaleString()}`
            : value
        return `${label}: ${formatted}`
      })
      .join('\n')

    addMessage('user', message)

    try {
      // Send back through extraction agent for validation and follow-up
      const followUpMessage = `I've provided: ${message}\n\nOriginal request: ${mergedParams.strategy_description || 'backtest strategy'}`

      const response = await api.extractTradingParameters({
        user_message: followUpMessage,
        conversation_history: state.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })

      // Update with any additional extractions or corrections
      setState(prev => ({
        ...prev,
        extractedParams: {
          ...mergedParams,
          ...response.extracted
        },
        isProcessing: false
      }))

      // Agent can now ask follow-up questions or validate
      if (response.needs_clarification) {
        // Agent wants more clarification - show as conversation
        let assistantMessage = ''

        if (response.clarification_questions.length > 0) {
          // Check if these are validation questions vs. new questions
          const firstQuestion = response.clarification_questions[0]
          if (firstQuestion.question.includes('Did you mean') ||
              firstQuestion.question.includes('is this correct') ||
              firstQuestion.question.includes('Are you sure')) {
            // Validation question - respond conversationally
            assistantMessage = response.clarification_questions.map(q => q.question).join('\n\n')
            addMessage('assistant', assistantMessage)
            // Don't show form, wait for user response
          } else {
            // New information needed - show forms
            addMessage('assistant', 'I need a bit more information:')
            setState(prev => ({
              ...prev,
              pendingClarification: {
                questions: response.clarification_questions,
                currentIndex: 0
              }
            }))
          }
        } else {
          addMessage('assistant', 'Could you provide more details?')
        }
      } else {
        // Check if we have everything
        const requiredFields = ['strategy_description', 'capital', 'start_date', 'end_date']
        const finalParams = { ...mergedParams, ...response.extracted }
        const stillMissing = requiredFields.filter(f => !finalParams[f as keyof ExtractedParameters])

        if (stillMissing.length === 0) {
          const strategyType = finalParams.strategy_type

          if (strategyType === 'technical_dsl') {
            addMessage('assistant', '✅ Perfect! Generating your technical strategy DSL...')
          } else {
            addMessage('assistant', '✅ Perfect! Generating your AI-managed strategy DSL...')
          }

          // ALWAYS generate YAML for both types
          setTimeout(() => generateYAMLForApproval(), 500)
        } else {
          addMessage('assistant', `Thanks! Still need: ${stillMissing.join(', ')}`)
        }
      }

    } catch (error: any) {
      setState(prev => ({ ...prev, isProcessing: false }))
      toast.error(error.message || 'Failed to process')
      addMessage('assistant', '❌ Sorry, something went wrong. Could you try again?')
    }
  }

  const handleApprove = async () => {
    setState(prev => ({ ...prev, pendingApproval: false, isProcessing: true }))
    addMessage('system', '🤖 Creating backtest...')

    try {
      // Generate YAML if needed (for agent-managed or if not generated yet)
      let yamlDsl = state.generatedYaml

      if (!yamlDsl && state.extractedParams.strategy_description) {
        addMessage('system', '✨ Generating strategy YAML...')

        const yamlResult = await api.generateStrategyDSL({
          strategy_description: state.extractedParams.strategy_description,
          ticker_list: state.extractedParams.ticker_list || [],
          initial_capital: state.extractedParams.capital || 100000,
          rebalance_frequency: state.extractedParams.rebalance_frequency || 'weekly',
          position_sizing: state.extractedParams.position_sizing || 'equal_weight',
          max_positions: state.extractedParams.max_positions || 10,
          strategy_type: state.extractedParams.strategy_type || 'agent_managed',
        })

        yamlDsl = yamlResult.yaml_dsl
        setState(prev => ({ ...prev, generatedYaml: yamlDsl }))
      }

      // Execute intent
      addMessage('system', '🚀 Executing...')

      // When user clicks Execute, they're clearly creating a backtest
      // No need for LLM intent detection at this point
      const result = await api.executeTradingIntent({
        intent: 'backtest',
        parameters: state.extractedParams,
        strategy_dsl_yaml: yamlDsl
      })

      if (result.success) {
        toast.success(result.message)

        // Navigate based on result
        if (result.backtest_id) {
          navigate(`/backtests/${result.backtest_id}`)
        } else if (result.analysis_id) {
          navigate(`/analyses/${result.analysis_id}`)
        }
      } else {
        addMessage('assistant', `⚠️ ${result.message}`)
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to execute')
      addMessage('assistant', `❌ Error: ${error.message || 'Something went wrong'}`)
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }

  const handleCancel = () => {
    setState(prev => ({
      ...prev,
      pendingApproval: false,
      extractedParams: {}
    }))
    addMessage('assistant', 'Cancelled. Feel free to start over with a new description.')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '900px',
      margin: '0 auto',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        borderBottom: '1px solid rgba(77, 166, 255, 0.3)',
        marginBottom: '1rem'
      }}>
        <Button
          onClick={() => navigate('/backtests')}
          style={{ padding: '0.5rem' }}
        >
          <ArrowLeft size={18} />
        </Button>

        <div style={{ flex: 1 }}>
          <h1 style={{
            color: '#4da6ff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.5rem',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={24} />
            AI Trading Assistant
          </h1>
          <p style={{
            color: '#8899aa',
            fontSize: '0.875rem',
            margin: '0.25rem 0 0 0',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            Describe your strategy in natural language
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {state.messages.map((message, idx) => (
          <ChatMessage key={idx} message={message} />
        ))}

        {state.isProcessing && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem',
            color: '#00d4ff'
          }}>
            <Loader2 className="animate-spin" size={20} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
              Processing...
            </span>
          </div>
        )}

        {/* Parameter Approval Card */}
        {state.pendingApproval && !state.isProcessing && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ParameterApprovalCard
              parameters={state.extractedParams}
              confidence={{}} // Could pass actual confidence scores
              suggestedDefaults={{
                rebalance_frequency: 'weekly',
                position_sizing: 'equal_weight',
                max_positions: 10
              }}
              onApprove={handleApprove}
              onCancel={handleCancel}
            />

            {/* Strategy DSL Visualization - Show for ALL strategy types */}
            {state.generatedYaml && (
              <div style={{
                border: state.extractedParams.strategy_type === 'agent_managed'
                  ? '2px solid #a78bfa'
                  : '2px solid #00d4ff',
                borderRadius: '8px',
                padding: '1.5rem',
                backgroundColor: state.extractedParams.strategy_type === 'agent_managed'
                  ? 'rgba(147, 51, 234, 0.05)'
                  : 'rgba(0, 212, 255, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    color: state.extractedParams.strategy_type === 'agent_managed' ? '#a78bfa' : '#00d4ff',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    margin: 0,
                    fontFamily: 'JetBrains Mono, monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {state.extractedParams.strategy_type === 'agent_managed' ? '🤖 AI-Managed Strategy DSL' : '📊 Technical Strategy DSL'}
                  </h3>
                  <button
                    onClick={() => generateYAMLForApproval()}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #4da6ff',
                      backgroundColor: 'transparent',
                      color: '#4da6ff',
                      fontSize: '0.75rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    🔄 Regenerate
                  </button>
                </div>
                <StrategyVisualizer yamlContent={state.generatedYaml} />
              </div>
            )}

            {/* Additional note for agent-managed strategies */}
            {state.extractedParams.strategy_type === 'agent_managed' && state.generatedYaml && (
              <div style={{
                padding: '1rem',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                borderRadius: '4px',
                backgroundColor: 'rgba(147, 51, 234, 0.05)'
              }}>
                <p style={{
                  color: '#8899aa',
                  fontSize: '0.8rem',
                  margin: 0,
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: '1.5'
                }}>
                  💡 <strong style={{ color: '#a78bfa' }}>Note:</strong> Your trading agents will use the DSL above as a flexible framework.
                  They'll analyze market conditions, sentiment, and technical indicators in real-time to make intelligent
                  trading decisions within your specified risk parameters.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Clarification Form */}
        {state.pendingClarification && !state.isProcessing && (
          <div style={{ marginTop: '1rem' }}>
            <ClarificationForm
              questions={state.pendingClarification.questions}
              onSubmit={handleClarificationSubmit}
              onSkip={() => setState(prev => ({ ...prev, pendingClarification: null }))}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem',
        borderTop: '1px solid rgba(77, 166, 255, 0.3)'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Describe your trading strategy..."
          disabled={state.isProcessing || state.pendingApproval}
          style={{
            flex: 1,
            padding: '0.75rem',
            backgroundColor: '#1a2a3a',
            border: '1px solid #4da6ff',
            color: '#fff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
            outline: 'none',
            borderRadius: '4px'
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || state.isProcessing || state.pendingApproval}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  )
}

