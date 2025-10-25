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
}

export const api = new APIService()
