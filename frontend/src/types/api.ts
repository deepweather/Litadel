// API Response Types

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface TradingDecision {
  decision: string // BUY, SELL, HOLD
  confidence?: number | null
  rationale?: string | null
}

export interface Analysis {
  id: string // UUID string
  ticker: string
  analysis_date: string
  status: AnalysisStatus
  progress_percentage?: number // Not in summary view
  current_agent?: string | null // Not in summary view
  selected_analysts?: string[] // NEW: Selected analysts for this analysis
  config?: any // Only in full response
  reports?: any[] // Only in full response
  created_at: string
  updated_at?: string // Not in summary view
  completed_at: string | null
  error_message: string | null
  trading_decision?: TradingDecision | null
}

export interface AnalysisStatusResponse {
  analysis_id: string // UUID string
  ticker: string
  status: AnalysisStatus
  progress_percentage: number
  current_agent: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface AnalysisReport {
  id: string // UUID string
  analysis_id: string // UUID string
  report_type: string
  content?: string // Optional: not included in WebSocket messages to keep them small
  created_at: string
}

export interface AnalysisLog {
  id: string // UUID string
  analysis_id: string // UUID string
  agent_name: string // Agent that generated this log
  log_type: 'reasoning' | 'tool_call' | 'system'
  content: string
  timestamp: string
}

export interface CreateAnalysisRequest {
  ticker: string
  analysis_date?: string
  selected_analysts?: string[]
  research_depth?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface WebSocketMessage {
  type: 'status_update' | 'log_update' | 'report_update' | 'error'
  analysis_id: string // UUID string
  status?: AnalysisStatus
  progress_percentage?: number
  current_agent?: string
  selected_analysts?: string[] // NEW: Selected analysts for this analysis
  log?: AnalysisLog
  report?: AnalysisReport
  error?: string
  timestamp: string
}

export interface APIError {
  detail: string
  status_code?: number
}
