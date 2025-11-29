"use client"

import React, { useState, useEffect } from 'react'
import { Search, FileText, Globe, Database, Eye } from 'lucide-react'
import DocumentPreviewModal from './document-preview-modal'
import UserFeedback from './user-feedback'
import VisualContentRenderer from './enhanced-visual-content-renderer'
import { getVisualContentByIds, extractVisualReferences } from '../rag/utils/visual-content-storage'
import { VisualContent } from '../rag/types'

interface BotMessageRendererProps {
  content: string
  messageId?: string
  source?: 'internal' | 'web' | 'rag'
  searchUrl?: string
  searchQuery?: string
  queryText?: string
  ragSources?: Array<{
    title: string
    content: string
    score: number
    documentId: string
    chunkId?: string
  }>
}

export function BotMessageRenderer({ content, messageId, source, searchUrl, ragSources, queryText }: BotMessageRendererProps) {
  const [previewDocument, setPreviewDocument] = useState<string | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [visualContent, setVisualContent] = useState<VisualContent[]>([])

  // Extract and load visual content when component mounts or content changes
  useEffect(() => {
    const loadVisualContent = async () => {
      const visualRefs = extractVisualReferences(content)
      if (visualRefs.length > 0) {
        const visuals = await getVisualContentByIds(visualRefs)
        setVisualContent(visuals)
      }
    }
    
    loadVisualContent()
  }, [content])

  const handleDocumentClick = (documentId: string) => {
    setPreviewDocument(documentId)
    setPreviewModalOpen(true)
  }

  // Function to format inline text (bold, italic, code)
  const formatInlineText = (text: string) => {
    // Handle bold text
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
    
    // Handle italic text
    text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
    
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">$1</code>')
    
    // Handle strikethrough
    text = text.replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-500 dark:text-gray-400">$1</del>')
    
    // Handle links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    return text
  }

  return (
    <div className="space-y-4">
      {/* Source indicator */}
      {source && (
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          {source === 'web' ? (
            <>
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Web Search Result
              </span>
            </>
          ) : source === 'rag' ? (
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

      {/* Main response content - nicely formatted */}
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-50 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-600 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-ul:space-y-1 prose-ol:space-y-1 prose-li:text-gray-700 dark:prose-li:text-gray-300">
        {content.split('\n').map((paragraph, index) => {
          if (!paragraph.trim()) return null
          
          // Handle headings
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={index} className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0">
                {paragraph.replace('### ', '')}
              </h3>
            )
          } else if (paragraph.startsWith('## ')) {
            return (
              <h2 key={index} className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3 first:mt-0">
                {paragraph.replace('## ', '')}
              </h2>
            )
          } else if (paragraph.startsWith('# ')) {
            return (
              <h1 key={index} className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4 first:mt-0">
                {paragraph.replace('# ', '')}
              </h1>
            )
          }
          
          // Handle lists
          if (paragraph.startsWith('- ') || paragraph.startsWith('• ')) {
            return (
              <ul key={index} className="list-disc list-inside ml-4 space-y-1">
                <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <span dangerouslySetInnerHTML={{ 
                    __html: formatInlineText(paragraph.replace(/^[-•]\s*/, '')) 
                  }} />
                </li>
              </ul>
            )
          }
          
          // Handle numbered lists
          if (paragraph.match(/^\d+\.\s+/)) {
            return (
              <ol key={index} className="list-decimal list-inside ml-4 space-y-1">
                <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <span dangerouslySetInnerHTML={{ 
                    __html: formatInlineText(paragraph.replace(/^\d+\.\s+/, '')) 
                  }} />
                </li>
              </ol>
            )
          }
          
          // Handle blockquotes
          if (paragraph.startsWith('> ')) {
            return (
              <blockquote key={index} className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-2 my-3 italic">
                <span className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ 
                  __html: formatInlineText(paragraph.replace(/^>\s*/, '')) 
                }} />
              </blockquote>
            )
          }
          
          // Regular paragraphs
          return (
            <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 last:mb-0">
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(paragraph) }} />
            </p>
          )
        })}
      </div>

      {/* Visual Content Rendering */}
      {visualContent.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Database className="w-4 h-4" />
            <span>Visual Content</span>
          </div>
          <div className="space-y-4">
            {visualContent.map((visual) => (
              <VisualContentRenderer 
                key={visual.id} 
                content={[visual]} 
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              />
            ))}
          </div>
        </div>
      )}

      {/* RAG sources - displayed after the response */}
      {ragSources && ragSources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Database className="w-4 h-4 text-purple-500" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Sources from Knowledge Base
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {ragSources.length} {ragSources.length === 1 ? 'source' : 'sources'}
            </span>
          </div>
          
          <div className="grid gap-3">
            {ragSources.map((source, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={() => handleDocumentClick(source.documentId)}
                    className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors cursor-pointer underline decoration-dotted flex items-center gap-1.5 flex-1"
                    title="Click to preview document"
                  >
                    <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{source.title}</span>
                  </button>
                  <div className="flex items-center space-x-2 ml-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {Math.round(source.score * 100)}% match
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                  {source.content.length > 200 ? `${source.content.substring(0, 200)}...` : source.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search link if available */}
      {searchUrl && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <Search className="w-3 h-3" />
            <span>View original search</span>
          </a>
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

      {/* User Feedback Component */}
      {messageId && (
        <UserFeedback
          messageId={messageId}
          messageContent={content}
          source={source}
          queryText={queryText}
          ragSources={ragSources?.map(source => ({
            ...source,
            chunkId: source.chunkId || source.documentId // fallback to documentId if chunkId not available
          }))}
          onFeedback={(feedback) => {
            console.log('Feedback received for message:', feedback)
            // Additional feedback handling can be added here
          }}
          className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3"
        />
      )}
    </div>
  )
}

export default BotMessageRenderer
