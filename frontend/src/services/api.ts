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
}

export const api = new APIService()
