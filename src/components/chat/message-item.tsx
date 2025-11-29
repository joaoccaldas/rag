"use client"

import React, { memo, useState } from 'react'
import Image from 'next/image'
import { Bot, User, Copy, ThumbsUp, MessageSquare, Clock, ExternalLink, Database } from 'lucide-react'
import { BotMessageRenderer } from '../bot-message-renderer'
import { useSettings } from '@/contexts/SettingsContext'

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
  index?: number
  isLast?: boolean
}

interface MessageItemProps {
  message: Message
  showTimestamp?: boolean
  onReact?: (messageId: string, reaction: string) => void
  onThread?: (messageId: string) => void
}

const MessageItemComponent = ({ 
  message, 
  showTimestamp = false, 
  onReact, 
  onThread 
}: MessageItemProps) => {
  const [showReactions, setShowReactions] = useState(false)
  const [copied, setCopied] = useState(false)
  const { settings } = useSettings()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const handleReaction = (reaction: string) => {
    onReact?.(message.id, reaction)
    setShowReactions(false)
  }

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp)
  }

  const formatDate = (timestamp: Date) => {
    const today = new Date()
    const messageDate = new Date(timestamp)
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    return messageDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSourceIcon = () => {
    switch (message.source) {
      case 'web':
        return <ExternalLink className="w-3 h-3" />
      case 'rag':
        return <Database className="w-3 h-3" />
      default:
        return null
    }
  }

  const getSourceColor = () => {
    switch (message.source) {
      case 'web':
        return 'text-blue-500'
      case 'rag':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="group relative">
      {showTimestamp && (
        <div className="flex items-center justify-center my-4">
          <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-caption text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(message.timestamp)} at {formatTime(message.timestamp)}
          </div>
        </div>
      )}

      <div className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
          message.type === 'user' 
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
          {message.type === 'user' ? (
            <User className="w-4 h-4" />
          ) : (
            settings.avatarUrl ? (
              <Image
                src={settings.avatarUrl}
                alt="AI Assistant"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <Bot className="w-4 h-4" />
            )
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 max-w-3xl ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block px-4 py-2 rounded-lg ${
            message.type === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          }`}>
            {message.type === 'bot' ? (
              <BotMessageRenderer 
                content={message.content} 
                messageId={message.id}
                source={message.source}
                searchUrl={message.searchUrl}
                ragSources={message.ragSources}
              />
            ) : (
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            )}
          </div>

          {/* Message Metadata */}
          <div className={`flex items-center gap-2 mt-1 text-caption text-muted-foreground ${
            message.type === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            <span>{formatTime(message.timestamp)}</span>
            {message.source && (
              <div className={`flex items-center gap-1 ${getSourceColor()}`}>
                {getSourceIcon()}
                <span className="capitalize">{message.source}</span>
              </div>
            )}
          </div>

          {/* RAG Sources */}
          {message.ragSources && message.ragSources.length > 0 && (
            <div className="mt-2 text-caption">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                <div className="flex items-center gap-1 text-green-700 dark:text-green-400 mb-1">
                  <Database className="w-3 h-3" />
                  <span className="font-medium">Sources from knowledge base:</span>
                </div>
                <div className="space-y-1">
                  {message.ragSources.slice(0, 3).map((source, index) => (
                    <div key={index} className="text-green-600 dark:text-green-400">
                      • {source.title} (relevance: {Math.round(source.score * 100)}%)
                    </div>
                  ))}
                  {message.ragSources.length > 3 && (
                    <div className="text-green-600 dark:text-green-400">
                      + {message.ragSources.length - 3} more sources
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Message Actions */}
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-2 flex items-center gap-2 ${
            message.type === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Copy message"
            >
              <Copy className="w-3 h-3" />
            </button>

            {message.type === 'bot' && onReact && (
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  title="React to message"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                
                {showReactions && (
                  <div className="absolute bottom-8 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 flex gap-1 z-10">
                    {['👍', '👎', '❤️', '😊', '🤔', '👏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-body-small"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {onThread && (
              <button
                onClick={() => onThread(message.id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Start thread"
              >
                <MessageSquare className="w-3 h-3" />
              </button>
            )}
          </div>

          {copied && (
            <div className="text-caption text-success mt-1">
              Message copied!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

MessageItemComponent.displayName = 'MessageItem'

export const MessageItem = memo(MessageItemComponent)
