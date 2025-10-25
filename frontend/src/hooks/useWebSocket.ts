import { useCallback, useEffect, useRef } from 'react'
import { WebSocketService } from '../services/websocket'
import type { WebSocketMessage } from '../types/api'

type MessageHandler = (message: WebSocketMessage) => void

export const useWebSocket = (analysisId: string | null, onMessage?: MessageHandler) => {
  const wsRef = useRef<WebSocketService | null>(null)

  const connect = useCallback(() => {
    if (analysisId && !wsRef.current) {
      wsRef.current = new WebSocketService(analysisId)

      if (onMessage) {
        wsRef.current.addHandler(onMessage)
      }

      wsRef.current.connect()
    }
  }, [analysisId, onMessage])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect()
      wsRef.current = null
    }
  }, [])

  const send = useCallback((data: any) => {
    if (wsRef.current) {
      wsRef.current.send(data)
    }
  }, [])

  const addHandler = useCallback((handler: MessageHandler) => {
    if (wsRef.current) {
      wsRef.current.addHandler(handler)
    }
  }, [])

  const removeHandler = useCallback((handler: MessageHandler) => {
    if (wsRef.current) {
      wsRef.current.removeHandler(handler)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    connect,
    disconnect,
    send,
    addHandler,
    removeHandler,
    isConnected: wsRef.current?.isConnected() ?? false,
  }
}
