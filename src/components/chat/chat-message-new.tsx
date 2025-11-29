/**
 * Individual Chat Message Component
 * Renders a single message with proper chat bubble styling and metadata
 */

import React, { useState } from 'react'
import { User, Bot, Clock, Copy, Check, ThumbsUp, ThumbsDown, Database, FileText, Hash } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Message, RAGSource } from './types'
import { SourceContentFormatter } from '../../utils/source-formatter'

interface ChatMessageProps {
  message: Message
  onRetry?: () => void
  onSourceClick?: (source: RAGSource) => void
  showTimestamp?: boolean
  showSources?: boolean
  showFeedback?: boolean
  className?: string
}

export function ChatMessage({
  message,
  onRetry,
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

  const handleSourceClick = (source: RAGSource) => {
    if (onSourceClick) {
      onSourceClick(source)
    }
  }

  return (
    <div className={cn(
      "flex gap-3 p-4 group",
      isUser ? "justify-end" : "justify-start",
      className
    )}>
      {/* Avatar for bot messages */}
      {isBot && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 miele:from-miele-red miele:to-miele-red/80 flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Message content */}
      <div className={cn("max-w-[85%] space-y-2", isUser ? "order-1" : "order-2")}>
        {/* Message bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-blue-600 miele:bg-miele-red text-white rounded-br-md ml-auto" 
            : "bg-white dark:bg-gray-800 miele:bg-white border border-gray-200 dark:border-gray-700 miele:border-miele-silver text-gray-900 dark:text-white miele:text-miele-charcoal rounded-bl-md"
        )}>
          {/* Source indicator for bot messages */}
          {isBot && message.source && (
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600 miele:border-miele-silver/50">
              {message.source === 'rag' ? (
                <>
                  <Database className="w-3 h-3 text-purple-500 miele:text-miele-red" />
                  <span className="text-xs text-purple-600 dark:text-purple-400 miele:text-miele-red font-medium">
                    Knowledge Base Result
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3 text-gray-500 miele:text-miele-charcoal/70" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 miele:text-miele-charcoal/70 font-medium">
                    Assistant Response
                  </span>
                </>
              )}
            </div>
          )}

          {/* Message content */}
          <div className={cn(
            isUser 
              ? "text-white leading-relaxed" 
              : "prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 miele:prose-headings:text-miele-charcoal prose-p:text-gray-700 dark:prose-p:text-gray-300 miele:prose-p:text-miele-charcoal/90 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 miele:prose-strong:text-miele-charcoal prose-code:bg-gray-100 dark:prose-code:bg-gray-700 miele:prose-code:bg-miele-silver/20 prose-code:text-gray-800 dark:prose-code:text-gray-200 miele:prose-code:text-miele-charcoal"
          )}>
            {isUser ? (
              <div>{message.content}</div>
            ) : (
              <div 
                className="markdown-content"
                dangerouslySetInnerHTML={{ 
                  __html: message.content
                    .replace(/\n/g, '<br />')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded text-sm">$1</code>')
                    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
                    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
                    .replace(/^\d+\.\s(.*)$/gm, '<li class="ml-4">$1</li>')
                    .replace(/^-\s(.*)$/gm, '<li class="ml-4">• $1</li>')
                }} 
              />
            )}
          </div>
        </div>

        {/* Timestamp and actions */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 miele:text-miele-charcoal/50 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "justify-end" : "justify-start"
        )}>
          {showTimestamp && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          
          {/* Actions for bot messages */}
          {isBot && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 miele:hover:bg-miele-cream/70 rounded transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
              
              {showFeedback && (
                <>
                  <button
                    onClick={() => handleFeedback('up')}
                    className={cn(
                      "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 miele:hover:bg-miele-cream/70 rounded transition-colors",
                      feedback === 'up' && "text-green-500"
                    )}
                    title="Good response"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleFeedback('down')}
                    className={cn(
                      "p-1 hover:bg-gray-100 dark:hover:bg-gray-700 miele:hover:bg-miele-cream/70 rounded transition-colors",
                      feedback === 'down' && "text-red-500"
                    )}
                    title="Poor response"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* RAG Sources - Only for bot messages after completion */}
        {isBot && showSources && message.ragSources && message.ragSources.length > 0 && 
         message.content && message.content.length > 0 && 
         (!message.isStreaming || message.isComplete) && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500 miele:text-miele-red" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 miele:text-miele-red">
                Sources ({message.ragSources.length})
              </span>
            </div>
            
            <div className="grid gap-3">
              {message.ragSources.slice(0, 3).map((source, index) => {
                const sourcePreview = SourceContentFormatter.generateSourcePreview(source)
                
                return (
                  <div 
                    key={`${source.documentId}-${index}`}
                    className="p-3 bg-emerald-50/80 dark:bg-emerald-900/10 miele:bg-miele-cream/30 rounded-lg border border-emerald-200 dark:border-emerald-700/30 miele:border-miele-silver/50 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/20 miele:hover:bg-miele-cream/50 transition-colors cursor-pointer group"
                    onClick={() => handleSourceClick(source)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400 miele:text-miele-red flex-shrink-0" />
                        <button 
                          className="font-medium text-emerald-800 dark:text-emerald-200 miele:text-miele-charcoal truncate text-sm hover:text-emerald-600 dark:hover:text-emerald-100 miele:hover:text-miele-red transition-colors text-left group-hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSourceClick(source)
                          }}
                          title={sourcePreview.formattedTitle}
                        >
                          {sourcePreview.formattedTitle}
                        </button>
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-emerald-500 miele:bg-miele-red rounded-full"></div>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 miele:text-miele-charcoal whitespace-nowrap">
                          {sourcePreview.scoreLabel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 miele:text-miele-charcoal/80 leading-relaxed bg-white/60 dark:bg-gray-800/60 miele:bg-white/80 rounded p-2 border border-emerald-100 dark:border-emerald-800/30 miele:border-miele-silver/30">
                      <div className="italic line-clamp-2">
                        &ldquo;{sourcePreview.formattedContent.slice(0, 120)}{sourcePreview.formattedContent.length > 120 ? '...' : ''}&rdquo;
                      </div>
                    </div>
                    
                    {sourcePreview.keyPhrases.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-2">
                        <Hash className="w-2.5 h-2.5 text-emerald-500 miele:text-miele-red" />
                        {sourcePreview.keyPhrases.slice(0, 3).map((phrase, phraseIndex) => (
                          <span 
                            key={phraseIndex}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-800/50 miele:bg-miele-red/10 text-emerald-700 dark:text-emerald-300 miele:text-miele-red"
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
                <div className="text-center py-2">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 miele:text-miele-red bg-emerald-100 dark:bg-emerald-900/30 miele:bg-miele-red/10 px-3 py-1 rounded-full">
                    + {message.ragSources.length - 3} more sources
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <div className="flex-shrink-0 order-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 miele:from-miele-charcoal miele:to-miele-charcoal/80 flex items-center justify-center shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}
