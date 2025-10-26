import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

interface BacktestStatusUpdate {
  type: 'status_update'
  backtest_id: number
  status: string
  progress_percentage: number
  timestamp: string
}

export const useBacktestWebSocket = (backtestId: number | null) => {
  const [status, setStatus] = useState<BacktestStatusUpdate | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)
  const { apiUrl, jwtToken, apiKey, authMethod } = useAuthStore()

  useEffect(() => {
    if (!backtestId) return

    // Get auth token
    const token = authMethod === 'jwt' ? jwtToken : apiKey
    if (!token) return

    // Convert http(s) to ws(s)
    const wsUrl = apiUrl.replace(/^http/, 'ws')
    const url = `${wsUrl}/api/v1/ws/backtests/${backtestId}?token=${encodeURIComponent(token)}`

    // Create WebSocket connection
    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      console.log(`WebSocket connected for backtest ${backtestId}`)
      setIsConnected(true)
    }

    ws.current.onmessage = (event) => {
      try {
        // Ignore non-JSON messages like "pong" keepalive
        if (typeof event.data === 'string' && (event.data === 'pong' || event.data === 'ping')) {
          return
        }

        const data = JSON.parse(event.data)
        if (data.type === 'status_update') {
          setStatus(data)
        }
      } catch (error) {
        // Silently ignore parse errors from non-JSON keepalive messages
        if (event.data !== 'pong' && event.data !== 'ping') {
          console.error('Failed to parse WebSocket message:', error, 'Data:', event.data)
        }
      }
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.current.onclose = () => {
      console.log(`WebSocket closed for backtest ${backtestId}`)
      setIsConnected(false)
    }

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send('ping')
      }
    }, 30000)

    // Cleanup on unmount
    return () => {
      clearInterval(pingInterval)
      if (ws.current) {
        ws.current.close()
        ws.current = null
      }
    }
  }, [backtestId, apiUrl, jwtToken, apiKey, authMethod])

  return { status, isConnected }
}

