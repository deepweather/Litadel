import React from 'react'
import { AlertCircle, Bot, User } from 'lucide-react'
import type { Message } from '../../types/trading'

interface ChatMessageProps {
  message: Message
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  const getMessageClasses = () => {
    if (isUser) {
      return 'bg-primary/20 border-primary self-end'
    }
    if (isSystem) {
      return 'bg-blue-500/10 border-blue-500 self-center'
    }
    return 'bg-blue-500/5 border-border self-start'
  }

  const getIcon = () => {
    if (isUser) return <User size={16} />
    if (isSystem) return <AlertCircle size={16} />
    return <Bot size={16} />
  }

  const getIconColorClass = () => {
    if (isUser) return 'text-primary'
    if (isSystem) return 'text-blue-500'
    return 'text-blue-500'
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'}`}>
      <div
        className={`max-w-[${isSystem ? '90%' : '75%'}] p-4 rounded-lg border font-mono text-sm ${getMessageClasses()}`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex-shrink-0 ${getIconColorClass()}`}>
            {getIcon()}
          </div>

          <div className="flex-1">
            <div className="text-foreground whitespace-pre-wrap break-words">
              {message.content}
            </div>

            <div className="mt-2 text-muted-foreground text-xs opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

