/**
 * Enhanced Message Renderer Component
 * Renders chat messages with full markdown support and proper styling
 */

import React from 'react'
import { Bot, User, Globe, Database, FileText, ExternalLink, Hash } from 'lucide-react'
import { renderMarkdown } from '../formatting/markdown-utils'
import { cn } from '@/utils/cn'
import { SourceContentFormatter } from '../../../utils/source-formatter'

export interface MessageSource {
  title: string
  content: string
  score: number
  documentId: string
  chunkId?: string
}

export interface EnhancedMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  source?: 'internal' | 'web' | 'rag'
  searchUrl?: string
  searchQuery?: string
  ragSources?: MessageSource[]
}

interface EnhancedMessageRendererProps {
  message: EnhancedMessage
  showTimestamp?: boolean
  showSources?: boolean
  onSourceClick?: (source: MessageSource) => void
  onRetry?: () => void
  className?: string
}

export function EnhancedMessageRenderer({
  message,
  showTimestamp = true,
  showSources = true,
  onSourceClick,
  onRetry,
  className
}: EnhancedMessageRendererProps) {
  const isUser = message.type === 'user'

  const getSourceIcon = () => {
    switch (message.source) {
      case 'web':
        return <Globe className="w-4 h-4 text-blue-500" />
      case 'rag':
        return <Database className="w-4 h-4 text-purple-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getSourceLabel = () => {
    switch (message.source) {
      case 'web':
        return 'Web Search Result'
      case 'rag':
        return 'Knowledge Base Result'
      default:
        return 'Assistant Response'
    }
  }

  return (
    <div className={cn(
      'flex gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
      className
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser
          ? 'bg-primary-500 text-white'
          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header with timestamp and source */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
            {isUser ? 'You' : 'Assistant'}
          </span>
          
          {/* Source indicator */}
          {message.source && (
            <div className="flex items-center space-x-2">
              {getSourceIcon()}
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {getSourceLabel()}
              </span>
            </div>
          )}

          {showTimestamp && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>

        {/* Message Content with Enhanced Markdown */}
        <div className="mb-4">
          {isUser ? (
            // User messages: simple formatting
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <div 
                className="text-sm text-blue-900 dark:text-blue-100"
                dangerouslySetInnerHTML={{
                  __html: message.content
                    .replace(/\n/g, '<br />')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                    .replace(/`([^`]+)`/g, '<code class="bg-blue-100 dark:bg-blue-800 px-1 rounded">$1</code>')
                }}
              />
            </div>
          ) : (
            // Bot messages: full markdown rendering
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(message.content)
              }}
            />
          )}
        </div>

        {/* RAG Sources */}
        {showSources && message.ragSources && message.ragSources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Document Sources ({message.ragSources.length})
              </span>
            </div>
            <div className="grid gap-3">
              {message.ragSources.slice(0, 3).map((source, index) => {
                const sourcePreview = SourceContentFormatter.generateSourcePreview(source)
                
                return (
                  <div 
                    key={`${source.documentId}-${index}`}
                    className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer group"
                    onClick={() => onSourceClick?.(source)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <button 
                          className="font-semibold text-emerald-800 dark:text-emerald-200 truncate text-sm hover:text-emerald-600 dark:hover:text-emerald-100 transition-colors text-left group-hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSourceClick?.(source)
                          }}
                          title={sourcePreview.formattedTitle}
                        >
                          {sourcePreview.formattedTitle}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                          {sourcePreview.scoreLabel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed mb-3 bg-white/50 dark:bg-gray-800/50 rounded-md p-3 border border-emerald-100 dark:border-emerald-800">
                      <div className="italic">
                        &ldquo;{sourcePreview.formattedContent}{sourcePreview.formattedContent.length >= 180 ? '...' : ''}&rdquo;
                      </div>
                    </div>
                    
                    {sourcePreview.keyPhrases.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Hash className="w-3 h-3 text-emerald-500" />
                        {sourcePreview.keyPhrases.map((phrase, phraseIndex) => (
                          <span 
                            key={phraseIndex}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300"
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {message.ragSources.length > 3 && (
                <div className="text-center py-3">
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    + {message.ragSources.length - 3} more sources available
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search URL */}
        {message.searchUrl && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <a
              href={message.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
            >
              <ExternalLink className="w-3 h-3" />
              View search results
            </a>
          </div>
        )}

        {/* Retry Button */}
        {onRetry && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onRetry}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              🔄 Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
