/**
 * Enhanced Message Renderer
 * Consolidates and improves upon bot-message-renderer with better organization
 */

import React, { useState, useEffect } from 'react'
import { Search, FileText, Globe, Database, Eye, BookOpen, Hash } from 'lucide-react'
import DocumentPreviewModal from '../../document-preview-modal'
import UserFeedback from '../../user-feedback'
import VisualContentRenderer from '../../enhanced-visual-content-renderer'
import { getVisualContentByIds, extractVisualReferences } from '../../../rag/utils/visual-content-storage'
import { VisualContent } from '../../../rag/types'
import { renderMarkdown, MarkdownOptions } from '../formatters/markdown-utils'
import { Message, RAGSource } from '../types'
import { SourceContentFormatter } from '../../../utils/source-formatter'

interface EnhancedMessageRendererProps {
  message: Message
  messageId?: string
  showSources?: boolean
  showFeedback?: boolean
  showVisualContent?: boolean
  markdownOptions?: MarkdownOptions
  onSourceClick?: (source: RAGSource) => void
}

export function EnhancedMessageRenderer({ 
  message, 
  messageId, 
  showSources = true,
  showFeedback = true,
  showVisualContent = true,
  markdownOptions = {},
  onSourceClick
}: EnhancedMessageRendererProps) {
  const [previewDocument, setPreviewDocument] = useState<string | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [visualContent, setVisualContent] = useState<VisualContent[]>([])

  // Extract and load visual content when component mounts or content changes
  useEffect(() => {
    if (!showVisualContent) return
    
    const loadVisualContent = async () => {
      const visualRefs = extractVisualReferences(message.content)
      if (visualRefs.length > 0) {
        const visuals = await getVisualContentByIds(visualRefs)
        setVisualContent(visuals)
      }
    }
    
    loadVisualContent()
  }, [message.content, showVisualContent])

  const handleDocumentClick = (documentId: string) => {
    setPreviewDocument(documentId)
    setPreviewModalOpen(true)
  }

  const handleSourceClick = (source: RAGSource) => {
    if (onSourceClick) {
      onSourceClick(source)
    } else {
      // Default behavior - open document preview
      handleDocumentClick(source.documentId)
    }
  }

  return (
    <div className="space-y-4">
      {/* Source indicator */}
      {message.source && (
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          {message.source === 'web' ? (
            <>
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Web Search Result
              </span>
            </>
          ) : message.source === 'rag' ? (
            <>
              <Database className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Knowledge Base Result
              </span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Assistant Response
              </span>
            </>
          )}
        </div>
      )}

      {/* Main response content - enhanced markdown formatting */}
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-50 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-600 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-ul:space-y-1 prose-ol:space-y-1 prose-li:text-gray-700 dark:prose-li:text-gray-300">
        {renderMarkdown(message.content, markdownOptions)}
      </div>

      {/* Visual Content */}
      {showVisualContent && visualContent.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Visual Content ({visualContent.length})
            </span>
          </div>
          <VisualContentRenderer content={visualContent} />
        </div>
      )}

      {/* RAG Sources - Only show after content is complete */}
      {showSources && message.ragSources && message.ragSources.length > 0 && 
       message.content && message.content.length > 0 && 
       (!message.isStreaming || message.isComplete) && (
        <div className="mt-6 space-y-3 border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Sources ({message.ragSources.length})
            </span>
          </div>
          
          <div className="grid gap-3">
            {message.ragSources.slice(0, 3).map((source, index) => {
              const sourcePreview = SourceContentFormatter.generateSourcePreview(source)
              
              return (
                <div 
                  key={`${source.documentId}-${index}`}
                  className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer group"
                  onClick={() => handleSourceClick(source)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <button 
                        className="font-semibold text-emerald-800 dark:text-emerald-200 truncate text-sm hover:text-emerald-600 dark:hover:text-emerald-100 transition-colors text-left group-hover:underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSourceClick(source)
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
                  <BookOpen className="w-4 h-4" />
                  + {message.ragSources.length - 3} more sources available
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search metadata */}
      {message.searchUrl && (
        <div className="mt-2 text-xs">
          <a
            href={message.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            View search results
          </a>
        </div>
      )}

      {/* User Feedback */}
      {showFeedback && messageId && message.source && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <UserFeedback 
            messageId={messageId} 
            messageContent={message.content}
            source={message.source}
            {...(message.ragSources && {
              ragSources: message.ragSources.map(source => ({
                title: source.title,
                content: source.content,
                score: source.score,
                documentId: source.documentId,
                chunkId: source.chunkId || ''
              }))
            })}
          />
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          documentId={previewDocument}
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false)
            setPreviewDocument(null)
          }}
        />
      )}
    </div>
  )
}
