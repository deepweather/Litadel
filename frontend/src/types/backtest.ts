export interface Backtest {
  id: number
  name: string
  description: string | null
  strategy_description: string
  strategy_dsl_yaml: string
  ticker_list: string[]
  start_date: string
  end_date: string
  initial_capital: number
  rebalance_frequency: string
  position_sizing: string
  max_positions: number
  status: string
  progress_percentage: number
  final_portfolio_value: number | null
  total_return: number | null
  total_return_pct: number | null
  sharpe_ratio: number | null
  max_drawdown: number | null
  max_drawdown_pct: number | null
  win_rate: number | null
  total_trades: number | null
  avg_trade_duration_days: number | null
  created_at: string
  updated_at: string
  completed_at: string | null
  owner_username: string | null
}

export interface BacktestSummary {
  id: number
  name: string
  description: string | null
  ticker_list: string[]
  start_date: string
  end_date: string
  initial_capital: number
  status: string
  progress_percentage: number
  total_return_pct: number | null
  sharpe_ratio: number | null
  max_drawdown_pct: number | null
  total_trades: number | null
  created_at: string
  completed_at: string | null
  owner_username: string | null
}

export interface BacktestTrade {
  id: number
  backtest_id: number
  ticker: string
  action: string
  quantity: number
  price: number
  trade_date: string
  analysis_id: string | null
  decision_confidence: number | null
  decision_rationale: string | null
  pnl: number | null
  pnl_pct: number | null
  created_at: string
}

export interface BacktestSnapshot {
  id: number
  backtest_id: number
  snapshot_date: string
  cash: number
  positions_value: number
  total_value: number
  cumulative_return: number
  cumulative_return_pct: number
  drawdown: number
  drawdown_pct: number
  positions: Record<string, { quantity: number; value: number; price: number }>
}

export interface BacktestPerformanceMetrics {
  total_return: number | null
  total_return_pct: number | null
  sharpe_ratio: number | null
  max_drawdown: number | null
  max_drawdown_pct: number | null
  win_rate: number | null
  total_trades: number | null
  avg_trade_duration_days: number | null
  profit_factor: number | null
  avg_win: number | null
  avg_loss: number | null
  win_count: number | null
  loss_count: number | null
}

export interface EquityCurveDataPoint {
  date: string
  portfolio_value: number
  cash: number
  positions_value: number
  cumulative_return_pct: number
  drawdown_pct: number
}

export interface CreateBacktestRequest {
  name: string
  description?: string
  strategy_description: string
  strategy_dsl_yaml?: string  // Optional - will be auto-generated if not provided
  ticker_list: string[]
  start_date: string
  end_date: string
  initial_capital: number
  rebalance_frequency: string
  position_sizing: string
  max_positions: number
}

export interface UpdateBacktestRequest {
  name?: string
  description?: string
  strategy_description?: string
  strategy_dsl_yaml?: string
  ticker_list?: string[]
  start_date?: string
  end_date?: string
  initial_capital?: number
  rebalance_frequency?: string
  position_sizing?: string
  max_positions?: number
}

