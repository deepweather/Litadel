import type { WebSocketMessage } from '../types/api'
import { useAuthStore } from '../stores/authStore'

type MessageHandler = (message: WebSocketMessage) => void

export class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Set<MessageHandler> = new Set()
  private analysisId: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private shouldReconnect = true

  constructor(analysisId: string) {
    this.analysisId = analysisId
  }

  connect(): void {
    const { apiUrl, apiKey } = useAuthStore.getState()
    const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://')
    const url = `${wsUrl}/api/v1/ws/analyses/${this.analysisId}`

    try {
      // when we (re)connect, allow reconnects on unexpected closes
      this.shouldReconnect = true
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0

        // Send API key for authentication
        if (apiKey) {
          this.send({ type: 'auth', api_key: apiKey })
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handlers.forEach((handler) => handler(message))
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        if (this.shouldReconnect) {
          this.attemptReconnect()
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * this.reconnectAttempts

      setTimeout(() => {
        this.connect()
      }, delay)
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  addHandler(handler: MessageHandler): void {
    this.handlers.add(handler)
  }

  removeHandler(handler: MessageHandler): void {
    this.handlers.delete(handler)
  }

  disconnect(): void {
    if (this.ws) {
      // prevent auto-reconnect on intentional disconnect (e.g., React StrictMode cleanup)
      this.shouldReconnect = false
      this.ws.close()
      this.ws = null
    }
    this.handlers.clear()
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}
