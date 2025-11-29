/**
 * Chat Message List Component
 * Displays chat messages with virtual scrolling for performance
 */

import React, { useEffect, useRef, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { cn } from '@/utils/cn'
import { Message } from './types'
import { ChatMessage } from './chat-message'

interface ChatMessageListProps {
  messages: Message[]
  isLoading?: boolean
  className?: string
  height?: number
  autoScroll?: boolean
  onRetryMessage?: (messageId: string) => void
}

export function ChatMessageList({
  messages,
  isLoading = false,
  className,
  height = 400,
  autoScroll = true,
  onRetryMessage,
}: ChatMessageListProps) {
  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > 0 && listRef.current) {
      listRef.current.scrollToItem(messages.length - 1, 'end')
    }
  }, [messages.length, autoScroll])

  // Message item renderer for virtual scrolling
  const MessageItem = useMemo(() => {
    const ItemComponent = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const message = messages[index]
      if (!message) return null

      return (
        <div style={style}>
          <ChatMessage
            message={message}
            onRetry={onRetryMessage ? () => onRetryMessage(message.id) : undefined}
            className="px-4 py-2"
          />
        </div>
      )
    }
    ItemComponent.displayName = 'MessageItem'
    return ItemComponent
  }, [messages, onRetryMessage])

  // Calculate item size (estimated height per message)
  const getItemSize = () => {
    // Base size + dynamic content consideration
    return 80 // Approximate height per message
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-center text-neutral-500 dark:text-neutral-400">
          <div className="text-lg font-medium mb-2">Start a conversation</div>
          <div className="text-sm">
            Send a message to begin chatting with the AI assistant
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={cn('flex-1 overflow-hidden', className)}
    >
      {/* Virtual scrolling list */}
      <List
        ref={listRef}
        height={height}
        width="100%"
        itemCount={messages.length}
        itemSize={getItemSize()}
        overscanCount={5}
        className="scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600"
      >
        {MessageItem}
      </List>

      {/* Loading indicator at bottom */}
      {isLoading && (
        <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-sm">AI is thinking...</span>
          </div>
        </div>
      )}
    </div>
  )
}
