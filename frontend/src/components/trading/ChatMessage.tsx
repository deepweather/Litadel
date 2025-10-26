import React from 'react'
import { AlertCircle, Bot, User } from 'lucide-react'
import type { Message } from '../../types/trading'

interface ChatMessageProps {
  message: Message
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  const getMessageStyle = () => {
    if (isUser) {
      return {
        backgroundColor: 'rgba(77, 166, 255, 0.2)',
        border: '1px solid #4da6ff',
        alignSelf: 'flex-end' as const
      }
    }
    if (isSystem) {
      return {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        border: '1px solid #00d4ff',
        alignSelf: 'center' as const
      }
    }
    return {
      backgroundColor: 'rgba(0, 212, 255, 0.05)',
      border: '1px solid rgba(77, 166, 255, 0.3)',
      alignSelf: 'flex-start' as const
    }
  }

  const getIcon = () => {
    if (isUser) return <User size={16} />
    if (isSystem) return <AlertCircle size={16} />
    return <Bot size={16} />
  }

  const getIconColor = () => {
    if (isUser) return '#4da6ff'
    if (isSystem) return '#00d4ff'
    return '#00d4ff'
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : isSystem ? 'center' : 'flex-start',
        marginBottom: '1rem'
      }}
    >
      <div
        style={{
          maxWidth: isSystem ? '90%' : '75%',
          padding: '1rem',
          borderRadius: '8px',
          ...getMessageStyle(),
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.875rem'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <div style={{
            color: getIconColor(),
            marginTop: '0.125rem',
            flexShrink: 0
          }}>
            {getIcon()}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              color: '#fff',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {message.content}
            </div>

            <div style={{
              marginTop: '0.5rem',
              color: '#8899aa',
              fontSize: '0.7rem',
              opacity: 0.7
            }}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

