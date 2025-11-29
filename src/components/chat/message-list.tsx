"use client"

import React, { memo, useMemo, forwardRef, useState, useEffect } from 'react'
import { MessageItem } from './message-item'
import { TypingIndicator } from './typing-indicator'
import { profileManager } from '../../utils/profile-manager'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  source?: 'internal' | 'web' | 'rag'
  searchUrl?: string
  searchQuery?: string
  ragSources?: Array<{
    title: string
    content: string
    score: number
    documentId: string
  }>
}

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  className?: string
  onMessageReact?: (messageId: string, reaction: string) => void
  onMessageThread?: (messageId: string) => void
}

const MessageListComponent = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages = [], isLoading = false, className = '', onMessageReact, onMessageThread }: MessageListProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    // Get active profile for personalized welcome message
    const [profileName, setProfileName] = useState<string>('AI Assistant')
    
    useEffect(() => {
      const activeProfile = profileManager.getActiveProfile()
      if (activeProfile) {
        setProfileName(activeProfile.chatbotName || activeProfile.displayName || 'AI Assistant')
      }
    }, [])
    
    // Safety check for undefined messages with memoization
    const safeMessages = useMemo(() => 
      Array.isArray(messages) ? messages : [], 
      [messages]
    )
    
    // Memoize message items to prevent unnecessary re-renders
    const messageItems = useMemo(() => 
      safeMessages.map((message: Message, index: number) => ({
        ...message,
        index,
        isLast: index === safeMessages.length - 1
      })), 
      [safeMessages]
    )

    if (safeMessages.length === 0) {
      return (
        <div 
          ref={ref}
          className={`flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 overflow-hidden ${className}`}
        >
          <div className="text-center">
            <p className="text-body-large mb-2">Welcome to {profileName}</p>
            <p className="text-body-small">Start a conversation by typing a message below</p>
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className={`flex-1 overflow-y-auto ${className}`}>
        <div className="space-y-4 p-4 min-h-full">
          {messageItems.map((messageData) => (
            <MessageItem
              key={messageData.id}
              message={messageData}
              onReact={onMessageReact}
              onThread={onMessageThread}
              showTimestamp={messageData.index === 0 || (messageData.index > 0 && 
                new Date(messageData.timestamp).getTime() - new Date(messageItems[messageData.index - 1].timestamp).getTime() > 300000
              )}
            />
          ))}
          {isLoading && <TypingIndicator />}
        </div>
      </div>
    )
  }
)

MessageListComponent.displayName = 'MessageList'

export const MessageList = memo(MessageListComponent)
