import axios, { AxiosError, type AxiosInstance } from 'axios'
import { useAuthStore } from '../stores/authStore'
import type {
  Analysis,
  AnalysisLog,
  AnalysisReport,
  AnalysisStatusResponse,
  APIError,
  CreateAnalysisRequest,
  PaginatedResponse,
} from '../types/api'
import type {
  CreatePortfolioRequest,
  CreatePositionRequest,
  Portfolio,
  PortfolioSummary,
  Position,
  UpdatePortfolioRequest,
  UpdatePositionRequest,
} from '../types/portfolio'
import type {
  Backtest,
  BacktestPerformanceMetrics,
  BacktestSnapshot,
  BacktestSummary,
  BacktestTrade,
  CreateBacktestRequest,
  EquityCurveDataPoint,
  UpdateBacktestRequest,
} from '../types/backtest'

class APIService {
  public client: AxiosInstance

  constructor() {
    this.client = axios.create({
      timeout: 30000,
    })

    // Request interceptor to add authentication headers
    this.client.interceptors.request.use((config) => {
      const { apiKey, jwtToken, apiUrl, authMethod } = useAuthStore.getState()
      config.baseURL = apiUrl

      // Add appropriate auth header based on method
      if (authMethod === 'jwt' && jwtToken) {
        config.headers['Authorization'] = `Bearer ${jwtToken}`
      } else if (authMethod === 'apikey' && apiKey) {
        config.headers['X-API-Key'] = apiKey
      }

      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<APIError>) => {
        if (error.response?.status === 401) {
          // Invalid authentication - clear auth state
          useAuthStore.getState().clearAuth()
          // Redirect to login page
          if (window.location.pathname !== '/login' && window.location.pathname !== '/settings') {
            window.location.href = '/login'
          }
        }

        const apiError: APIError = {
          detail: error.response?.data?.detail || error.message || 'An error occurred',
          status_code: error.response?.status,
        }

        return Promise.reject(apiError)
      }
    )
  }

  // Analysis endpoints
  async getAnalyses(page = 1, pageSize = 50): Promise<PaginatedResponse<Analysis>> {
    const offset = (page - 1) * pageSize
    const response = await this.client.get<Analysis[]>('/api/v1/analyses', {
      params: { limit: pageSize, offset },
    })

    // API returns a plain array, so we wrap it in pagination structure
    const items = response.data
    return {
      items,
      total: items.length, // API doesn't provide total, so we use current count
      page,
      page_size: pageSize,
      total_pages: Math.ceil(items.length / pageSize),
    }
  }

  async getAnalysis(id: string): Promise<Analysis> {
    const response = await this.client.get<Analysis>(`/api/v1/analyses/${id}`)
    return response.data
  }

  async createAnalysis(data: CreateAnalysisRequest): Promise<Analysis> {
    const response = await this.client.post<Analysis>('/api/v1/analyses', data)
    return response.data
  }

  async getAnalysisStatus(id: string): Promise<AnalysisStatusResponse> {
    const response = await this.client.get<AnalysisStatusResponse>(`/api/v1/analyses/${id}/status`)
    return response.data
  }

  async getAnalysisReports(id: string): Promise<AnalysisReport[]> {
    const response = await this.client.get<AnalysisReport[]>(`/api/v1/analyses/${id}/reports`)
    return response.data
  }

  async getAnalysisLogs(id: string): Promise<AnalysisLog[]> {
    const response = await this.client.get<AnalysisLog[]>(`/api/v1/analyses/${id}/logs`)
    return response.data
  }

  async deleteAnalysis(id: string): Promise<void> {
    await this.client.delete(`/api/v1/analyses/${id}`)
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health')
      return true
    } catch {
      return false
    }
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<{
    access_token: string
    token_type: string
    username: string
    expires_in: number
  }> {
    const response = await this.client.post('/api/v1/auth/login', {
      username,
      password,
    })
    return response.data
  }

  async getCurrentUser(): Promise<{
    id: number
    username: string
    created_at: string
    is_active: boolean
  }> {
    const response = await this.client.get('/api/v1/auth/me')
    return response.data
  }

  // Portfolio endpoints
  async getPortfolios(): Promise<PortfolioSummary[]> {
    const response = await this.client.get<PortfolioSummary[]>('/api/v1/portfolios')
    return response.data
  }

  async getPortfolio(id: number): Promise<Portfolio> {
    const response = await this.client.get<Portfolio>(`/api/v1/portfolios/${id}`)
    return response.data
  }

  async createPortfolio(data: CreatePortfolioRequest): Promise<Portfolio> {
    const response = await this.client.post<Portfolio>('/api/v1/portfolios', data)
    return response.data
  }

  async updatePortfolio(id: number, data: UpdatePortfolioRequest): Promise<Portfolio> {
    const response = await this.client.put<Portfolio>(`/api/v1/portfolios/${id}`, data)
    return response.data
  }

  async deletePortfolio(id: number): Promise<void> {
    await this.client.delete(`/api/v1/portfolios/${id}`)
  }

  async addPosition(portfolioId: number, data: CreatePositionRequest): Promise<Position> {
    const response = await this.client.post<Position>(
      `/api/v1/portfolios/${portfolioId}/positions`,
      data
    )
    return response.data
  }

  async updatePosition(
    portfolioId: number,
    positionId: number,
    data: UpdatePositionRequest
  ): Promise<Position> {
    const response = await this.client.put<Position>(
      `/api/v1/portfolios/${portfolioId}/positions/${positionId}`,
      data
    )
    return response.data
  }

  async deletePosition(portfolioId: number, positionId: number): Promise<void> {
    await this.client.delete(`/api/v1/portfolios/${portfolioId}/positions/${positionId}`)
  }

  // Portfolio helper endpoints
  async getHistoricalPrice(
    ticker: string,
    date: string
  ): Promise<{ ticker: string; date: string; price: number; note?: string }> {
    const response = await this.client.get('/api/v1/portfolios/helpers/historical-price', {
      params: { ticker, date },
    })
    return response.data
  }

  async validateTicker(ticker: string): Promise<{
    ticker: string
    valid: boolean
    asset_class?: string
    current_price?: number
    message?: string
  }> {
    const response = await this.client.get('/api/v1/portfolios/helpers/validate-ticker', {
      params: { ticker },
    })
    return response.data
  }

  async bulkImportPositions(
    portfolioId: number,
    file: File
  ): Promise<{
    success: boolean
    added_count: number
    error_count: number
    added_positions: any[]
    errors: string[]
  }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.client.post(
      `/api/v1/portfolios/${portfolioId}/positions/bulk-import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  // Ticker/Asset endpoints
  async getTickerSummary(ticker: string): Promise<{
    ticker: string
    asset_class: string
    current_price: number | null
    analyses: {
      total_count: number
      completed_count: number
      latest_date: string | null
      latest_status: string | null
      decision_counts: { BUY: number; SELL: number; HOLD: number }
      latest_decision: {
        decision: string
        confidence: number | null
        rationale: string | null
        analysis_date: string
      } | null
    }
    holdings: {
      total_positions: number
      open_positions: number
      closed_positions: number
      total_quantity: number
      avg_entry_price: number | null
      current_value: number | null
      total_pnl: number
      unrealized_pnl: number
      realized_pnl: number
    }
  }> {
    const response = await this.client.get(`/api/v1/tickers/${ticker}/summary`)
    return response.data
  }

  async getTickerPositions(ticker: string): Promise<
    Array<{
      position: any
      portfolio_id: number
      portfolio_name: string
    }>
  > {
    const response = await this.client.get(`/api/v1/tickers/${ticker}/positions`)
    return response.data
  }

  async getTickerAnalyses(ticker: string): Promise<Analysis[]> {
    const response = await this.client.get(`/api/v1/tickers/${ticker}/analyses`)
    return response.data
  }

  // Backtest endpoints
  async createBacktest(data: CreateBacktestRequest): Promise<Backtest> {
    const response = await this.client.post<Backtest>('/api/v1/backtests', data)
    return response.data
  }

  async getBacktests(): Promise<BacktestSummary[]> {
    const response = await this.client.get<BacktestSummary[]>('/api/v1/backtests')
    return response.data
  }

  async getBacktest(id: number): Promise<Backtest> {
    const response = await this.client.get<Backtest>(`/api/v1/backtests/${id}`)
    return response.data
  }

  async updateBacktest(id: number, data: UpdateBacktestRequest): Promise<Backtest> {
    const response = await this.client.put<Backtest>(`/api/v1/backtests/${id}`, data)
    return response.data
  }

  async deleteBacktest(id: number): Promise<void> {
    await this.client.delete(`/api/v1/backtests/${id}`)
  }

  async getBacktestTrades(id: number): Promise<BacktestTrade[]> {
    const response = await this.client.get<BacktestTrade[]>(`/api/v1/backtests/${id}/trades`)
    return response.data
  }

  async getBacktestSnapshots(id: number): Promise<BacktestSnapshot[]> {
    const response = await this.client.get<BacktestSnapshot[]>(
      `/api/v1/backtests/${id}/snapshots`
    )
    return response.data
  }

  async getBacktestPerformance(id: number): Promise<BacktestPerformanceMetrics> {
    const response = await this.client.get<BacktestPerformanceMetrics>(
      `/api/v1/backtests/${id}/performance`
    )
    return response.data
  }

  async getBacktestEquityCurve(id: number): Promise<EquityCurveDataPoint[]> {
    const response = await this.client.get<EquityCurveDataPoint[]>(
      `/api/v1/backtests/${id}/equity-curve`
    )
    return response.data
  }

  async executeBacktest(id: number): Promise<{
    message: string
    backtest_id: number
    status: string
  }> {
    const response = await this.client.post(`/api/v1/backtests/${id}/execute`)
    return response.data
  }

  async cancelBacktest(id: number): Promise<{
    message: string
    backtest_id: number
  }> {
    const response = await this.client.post(`/api/v1/backtests/${id}/cancel`)
    return response.data
  }

  async generateStrategyDSL(
    data: {
      strategy_description: string
      ticker_list: string[]
      initial_capital: number
      rebalance_frequency: string
      position_sizing: string
      max_positions: number
    },
    onChunk?: (chunk: string) => void
  ): Promise<{
    success: boolean
    yaml_dsl: string
    valid: boolean
    validation_message: string
  }> {
    // Use fetch for streaming instead of axios
    const { apiUrl, jwtToken, apiKey, authMethod } = useAuthStore.getState()

    // Build headers based on auth method
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authMethod === 'jwt' && jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`
    } else if (authMethod === 'apikey' && apiKey) {
      headers['X-API-Key'] = apiKey
    }

    const response = await fetch(`${apiUrl}/api/v1/backtests/generate-strategy-dsl`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to generate strategy DSL')
    }

    // Process the stream
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let accumulatedYAML = ''
    let isValid = false
    let validationMessage = ''

    if (!reader) {
      throw new Error('No response body')
    }

    console.log('🔥 Starting stream processing...')

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        console.log('✅ Stream complete')
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6)
            const data = JSON.parse(jsonStr)

            console.log('📦 Received event:', data.type, data.type === 'chunk' ? `(${data.content?.length} chars)` : '')

            if (data.type === 'start') {
              console.log('🚀 Stream started')
            } else if (data.type === 'chunk') {
              accumulatedYAML += data.content
              onChunk?.(data.content)
            } else if (data.type === 'complete') {
              accumulatedYAML = data.full_yaml
              isValid = data.valid
              validationMessage = data.validation_message
              console.log('✨ Generation complete, valid:', isValid)
            } else if (data.type === 'error') {
              console.error('❌ Stream error:', data.message)
              throw new Error(data.message)
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', line, e)
          }
        }
      }
    }

    return {
      success: true,
      yaml_dsl: accumulatedYAML,
      valid: isValid,
      validation_message: validationMessage,
    }
  }
}

export const api = new APIService()
