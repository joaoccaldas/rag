/**
 * Clean Chat Message Component
 * Renders a single message with proper chat bubble styling
 */

import React, { useState } from 'react'
import { User, Bot, Clock, Copy, Check, ThumbsUp, ThumbsDown, Database, FileText } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Message, RAGSource } from './types'

interface ChatMessageProps {
  message: Message
  onSourceClick?: (source: RAGSource) => void
  showTimestamp?: boolean
  showSources?: boolean
  showFeedback?: boolean
  className?: string
}

export function ChatMessage({
  message,
  onSourceClick,
  showTimestamp = true,
  showSources = true,
  showFeedback = true,
  className
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const isUser = message.type === 'user'
  const isBot = message.type === 'bot'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(feedback === type ? null : type)
  }

  const formatContent = (content: string) => {
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded text-sm">$1</code>')
      .replace(/^(.+)$/, '<p>$1</p>')
  }

  return (
    <div className={cn(
      "flex gap-3 p-4 group",
      isUser ? "justify-end" : "justify-start",
      className
    )}>
      {/* Bot Avatar */}
      {isBot && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={cn("max-w-[85%] space-y-2", isUser ? "order-1" : "order-2")}>
        {/* Message Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-blue-600 text-white rounded-br-md ml-auto" 
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-bl-md"
        )}>
          {/* Source indicator for bot messages */}
          {isBot && message.source && (
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
              {message.source === 'rag' ? (
                <>
                  <Database className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Knowledge Base Result
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Assistant Response
                  </span>
                </>
              )}
            </div>
          )}

          {/* Message Text */}
          <div className={cn(
            isUser 
              ? "text-white leading-relaxed" 
              : "prose prose-sm max-w-none dark:prose-invert"
          )}>
            {isUser ? (
              <div>{message.content}</div>
            ) : (
              <div 
                dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
              />
            )}
          </div>
        </div>

        {/* Actions and Timestamp */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "justify-end" : "justify-start"
        )}>
          {showTimestamp && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {!isUser && showFeedback && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy message"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => handleFeedback('up')}
                className={cn(
                  "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors",
                  feedback === 'up' && "bg-green-100 dark:bg-green-900/20 text-green-600"
                )}
                title="Good response"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleFeedback('down')}
                className={cn(
                  "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors",
                  feedback === 'down' && "bg-red-100 dark:bg-red-900/20 text-red-600"
                )}
                title="Poor response"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* RAG Sources */}
        {showSources && message.ragSources && message.ragSources.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Sources ({message.ragSources.length}):
            </div>
            <div className="space-y-1">
              {message.ragSources.slice(0, 3).map((source, index) => (
                <button
                  key={index}
                  onClick={() => onSourceClick?.(source)}
                  className="block w-full text-left text-xs p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {source.title}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 truncate">
                    {source.content.substring(0, 100)}...
                  </div>
                </button>
              ))}
              {message.ragSources.length > 3 && (
                <div className="text-center py-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    + {message.ragSources.length - 3} more sources
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 order-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}
