import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Send, Sparkles } from 'lucide-react'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChatMessage } from '../components/trading/ChatMessage'
import { StrategyParametersForm } from '../components/trading/StrategyParametersForm'
import { StrategyCodeVisualizer } from '../components/backtest/StrategyCodeVisualizer'
import { Card, CardContent } from '@/components/ui/card'
import type { Message } from '../types/trading'

interface FormData {
  strategy_type?: string | null
  strategy_description?: string
  capital?: number | null
  start_date?: string | null
  end_date?: string | null
  ticker_list?: string[]
  asset_preferences?: string
}

interface FieldConfidence {
  [key: string]: number
}

export const ChatTradingInterface: React.FC = () => {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'ll help you create a backtest. You can describe your strategy in chat, and I\'ll fill in the form on the right. You can also edit the form directly at any time.\n\n💬 Chat with me or 📋 fill the form - your choice!',
      timestamp: new Date()
    }
  ])

  const [formData, setFormData] = useState<FormData>({
    strategy_type: null,
    strategy_description: '',
    capital: null,
    start_date: null,
    end_date: null,
    ticker_list: [],
    asset_preferences: ''
  })

  const [fieldConfidence, setFieldConfidence] = useState<FieldConfidence>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | undefined>()
  const [showApproval, setShowApproval] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role: Message['role'], content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }])
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    setInput('')
    addMessage('user', userMessage)
    setIsProcessing(true)

    try {
      // Extract parameters from natural language with current form state as context
      const response = await api.extractTradingParameters({
        user_message: userMessage,
        conversation_history: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        current_form_state: formData
      })

      // Merge extracted parameters with existing form data
      // Only update fields that are currently empty/null
      const updates: Partial<FormData> = {}
      Object.entries(response.extracted).forEach(([key, value]) => {
        const currentValue = formData[key as keyof FormData]
        if (currentValue === null || currentValue === undefined || currentValue === '' ||
            (Array.isArray(currentValue) && currentValue.length === 0)) {
          updates[key as keyof FormData] = value as any
        }
      })

      setFormData(prev => ({ ...prev, ...updates }))
      setFieldConfidence(prev => ({ ...prev, ...response.confidence }))

      // Generate assistant response
      let assistantMessage = ''

      if (Object.keys(response.extracted).length > 0) {
        assistantMessage += '✅ Great! I extracted:\n\n'
        Object.entries(response.extracted).forEach(([key, value]) => {
          const confidence = response.confidence[key] || 1.0
          const icon = confidence > 0.8 ? '✓' : '⚠️'
          const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
          assistantMessage += `${icon} **${key.replace(/_/g, ' ')}**: ${displayValue}\n`
        })
        assistantMessage += '\n📋 Check the form on the right - you can edit any field!\n'
      }

      if (response.missing.length > 0) {
        assistantMessage += `\n📝 Still need: ${response.missing.map(m => m.replace(/_/g, ' ')).join(', ')}\n\n`
        assistantMessage += 'You can tell me in chat or fill the form directly →'
      } else {
        assistantMessage += '\n✨ All required fields filled! Click "Generate Strategy Code" when ready.'
      }

      addMessage('assistant', assistantMessage)

    } catch (error: any) {
      toast.error(error.message || 'Failed to process message')
      addMessage('assistant', '❌ Sorry, I encountered an error. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Update confidence to 1.0 for manually edited fields
    setFieldConfidence(prev => ({ ...prev, [field]: 1.0 }))

    // Add system message to chat
    const displayField = field.replace(/_/g, ' ')
    const displayValue = typeof value === 'number' && field === 'capital'
      ? `$${value.toLocaleString()}`
      : Array.isArray(value)
      ? value.join(', ')
      : String(value)

    addMessage('system', `✓ Updated ${displayField}: ${displayValue}`)
  }

  const handleGenerateStrategy = async () => {
    setIsGenerating(true)
    addMessage('system', '🤖 Generating strategy code...')

    try {
      const ticker = (formData.ticker_list && formData.ticker_list.length > 0)
        ? formData.ticker_list[0]
        : 'AAPL'

      const codeResult = await api.generateStrategyCode({
        strategy_description: formData.strategy_description || '',
        ticker: ticker,
        indicators: [],
        entry_conditions: {},
        exit_conditions: {},
        risk_params: {},
      })

      if (codeResult.success) {
        setGeneratedCode(codeResult.code)
        setShowApproval(true)
        addMessage('assistant', '✅ Strategy code generated! Review it below and click "Create Backtest" to proceed.')
      } else {
        addMessage('assistant', '⚠️ Failed to generate strategy code. Please try describing your strategy again.')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate code')
      addMessage('assistant', '❌ Error generating strategy code. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateBacktest = async () => {
    setIsProcessing(true)
    addMessage('system', '🚀 Creating backtest...')

    try {
      const result = await api.executeTradingIntent({
        intent: 'backtest',
        parameters: {
          ...formData,
          intent: 'backtest'
        },
        strategy_code_python: generatedCode
      })

      if (result.success) {
        toast.success(result.message)
        if (result.backtest_id) {
          navigate(`/backtests/${result.backtest_id}`)
        }
      } else {
        addMessage('assistant', `⚠️ ${result.message}`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create backtest')
      addMessage('assistant', `❌ Error: ${error.message || 'Something went wrong'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setShowApproval(false)
    setGeneratedCode(undefined)
    addMessage('assistant', 'Cancelled. You can modify the form and generate again when ready.')
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          onClick={() => navigate('/backtests')}
          variant="ghost"
          size="icon"
        >
          <ArrowLeft size={18} />
        </Button>

        <div className="flex-1">
          <h1 className="text-primary font-mono text-2xl m-0 flex items-center gap-2">
            <Sparkles size={24} />
            AI Trading Assistant
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            Chat or fill the form - your choice!
          </p>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col border-r">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message, idx) => (
              <ChatMessage key={idx} message={message} />
            ))}

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                <Loader2 className="animate-spin" size={20} />
                <span className="font-mono text-sm">Processing...</span>
              </div>
            )}

            {/* Strategy Code Preview */}
            {showApproval && generatedCode && (
              <div className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="font-mono text-sm font-bold mb-3 flex items-center gap-2">
                      {formData.strategy_type === 'agent_managed' ? '🤖' : '📊'}
                      Generated Strategy Code
                    </div>
                    <StrategyCodeVisualizer
                      codeContent={generatedCode}
                      strategyType={formData.strategy_type || undefined}
                    />
                    <div className="flex gap-3 mt-4">
                      <Button onClick={handleCreateBacktest} className="flex-1" disabled={isProcessing}>
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Backtest'
                        )}
                      </Button>
                      <Button onClick={handleCancel} variant="outline" disabled={isProcessing}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2 p-4 border-t">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Describe your strategy or ask questions..."
              disabled={isProcessing}
              className="flex-1 font-mono"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              size="icon"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-[400px] flex flex-col">
          <StrategyParametersForm
            formData={formData}
            fieldConfidence={fieldConfidence}
            onFieldChange={handleFieldChange}
            onGenerateStrategy={handleGenerateStrategy}
            isGenerating={isGenerating}
            disabled={isProcessing || showApproval}
          />
        </div>
      </div>
    </div>
  )
}
