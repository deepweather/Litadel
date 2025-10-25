// Portfolio types matching backend models

export interface Position {
  id: number
  portfolio_id: number
  ticker: string
  asset_class: string
  quantity: number
  entry_price: number
  entry_date: string
  exit_price?: number | null
  exit_date?: string | null
  status: 'open' | 'closed'
  notes?: string | null
  current_price?: number | null
  unrealized_pnl?: number | null
  realized_pnl?: number | null
  pnl_percentage?: number | null
  created_at: string
  updated_at: string
}

export interface Portfolio {
  id: number
  name: string
  description?: string | null
  positions: Position[]
  total_value: number
  total_cost_basis: number
  total_pnl: number
  total_pnl_percentage: number
  position_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PortfolioSummary {
  id: number
  name: string
  description?: string | null
  position_count: number
  total_value: number
  total_pnl: number
  total_pnl_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreatePortfolioRequest {
  name: string
  description?: string
}

export interface UpdatePortfolioRequest {
  name?: string
  description?: string
  is_active?: boolean
}

export interface CreatePositionRequest {
  ticker: string
  quantity: number
  entry_price: number
  entry_date: string
  asset_class?: string
  notes?: string
}

export interface UpdatePositionRequest {
  quantity?: number
  exit_price?: number
  exit_date?: string
  status?: 'open' | 'closed'
  notes?: string
}

