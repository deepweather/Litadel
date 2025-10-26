// Trading interface types for conversational backtest/analysis creation

export type TradingIntent = 'backtest' | 'live_trading' | 'analysis' | 'unclear'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export type StrategyType = 'agent_managed' | 'technical_dsl'

export interface ExtractedParameters {
  intent?: TradingIntent
  strategy_type?: StrategyType
  strategy_description?: string
  capital?: number
  start_date?: string
  end_date?: string
  ticker_list?: string[]
  asset_preferences?: string  // User's response to "What do you want to trade?"
  // Auto-defaulted fields (included for transparency)
  rebalance_frequency?: string
  position_sizing?: string
  max_positions?: number
  name?: string
  description?: string
}

export interface ClarificationQuestion {
  question: string
  field: string
  suggestions?: (string | number)[]
  field_type: string // Allow any string from backend, we'll handle it in the component
}

export interface ExtractParametersResponse {
  intent: TradingIntent
  extracted: Record<string, any>
  missing: string[]
  confidence: Record<string, number>
  needs_clarification: boolean
  clarification_questions: ClarificationQuestion[]
  suggested_defaults: Record<string, any>
}

export interface ExtractParametersRequest {
  user_message: string
  conversation_history: Array<{ role: string; content: string }>
}

export interface ExecuteTradingIntentRequest {
  intent: TradingIntent
  parameters: ExtractedParameters
  strategy_dsl_yaml?: string
}

export interface ExecuteTradingIntentResponse {
  backtest_id?: number
  analysis_id?: string
  message: string
  success: boolean
}

export interface ConversationState {
  messages: Message[]
  extractedParams: ExtractedParameters
  pendingApproval: boolean
  pendingClarification: {
    questions: ClarificationQuestion[]
    currentIndex: number
  } | null
  isProcessing: boolean
  generatedYaml?: string
}

