/**
 * Enhanced Virtual Scrolling Components
 * High-performance virtu# Document status indicator
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'processing':
    case 'chunking':
    case 'embedding':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    case 'uploading':
      return <Clock className="w-4 h-4 text-yellow-500" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-400" />
  }
}arge datasets
 */

"use client"

import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { FileText, File, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { Document, DocumentType } from '../../rag/types'
import { ComponentErrorBoundary } from '../error-boundary/error-boundary'

interface VirtualDocumentListProps {
  documents: Document[]
  onDocumentSelect: (document: Document) => void
  selectedDocuments: string[]
  onDocumentToggle: (documentId: string) => void
  height: number
  itemHeight?: number
  className?: string
  searchQuery?: string
  filterBy?: DocumentType | 'all'
  enableVirtualization?: boolean
  showMetrics?: boolean
}

interface DocumentItemData {
  documents: Document[]
  onDocumentSelect: (document: Document) => void
  selectedDocuments: string[]
  onDocumentToggle: (documentId: string) => void
  searchQuery?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface VirtualChatListProps {
  messages: ChatMessage[]
  height: number
  itemHeight?: number
  className?: string
  onMessageClick?: (message: ChatMessage) => void
  reverseOrder?: boolean
}

// Document type icon helper
const getDocumentIcon = (type: DocumentType) => {
  const iconProps = "w-5 h-5"
  switch (type) {
    case 'pdf':
      return <FileText className={`${iconProps} text-red-500`} />
    case 'docx':
      return <File className={`${iconProps} text-blue-500`} />
    case 'txt':
    case 'markdown':
      return <FileText className={`${iconProps} text-gray-500`} />
    case 'xlsx':
    case 'csv':
      return <File className={`${iconProps} text-green-500`} />
    case 'json':
      return <File className={`${iconProps} text-yellow-500`} />
    default:
      return <File className={`${iconProps} text-gray-400`} />
  }
}

// Document status indicator
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'processed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'processing':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-400" />
  }
}

// Virtual Document Item Component
const DocumentItem = React.memo<ListChildComponentProps<DocumentItemData>>(({ 
  index, 
  style, 
  data 
}) => {
  const { documents, onDocumentSelect, selectedDocuments, onDocumentToggle, searchQuery } = data
  const document = documents[index]

  if (!document) {
    return (
      <div style={style} className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const isSelected = selectedDocuments.includes(document.id)
  
  // Highlight search terms
  const highlightText = (text: string, query?: string) => {
    if (!query || !query.trim()) return text
    
    const regex = new RegExp(`(${query.trim()})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div 
      style={style}
      className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
      }`}
      onClick={() => onDocumentSelect(document)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getDocumentIcon(document.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {highlightText(document.name, searchQuery)}
            </h4>
            <div className="flex items-center gap-2 ml-2">
              {getStatusIcon(document.status)}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation()
                  onDocumentToggle(document.id)
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>
                {document.size ? `${(document.size / 1024).toFixed(1)} KB` : 'Unknown size'}
              </span>
              <span>
                {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Not uploaded'}
              </span>
            </div>
            
            {document.aiAnalysis?.summary && (
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                {highlightText(document.aiAnalysis.summary, searchQuery)}
              </p>
            )}
            
            {document.aiAnalysis?.keywords && (
              <div className="flex flex-wrap gap-1 mt-1">
                {document.aiAnalysis.keywords.slice(0, 3).map((keyword, i) => (
                  <span key={i} className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

DocumentItem.displayName = 'DocumentItem'

// Chat Message Item Component
const ChatMessageItem = React.memo<ListChildComponentProps<{ messages: ChatMessage[], onMessageClick?: (message: ChatMessage) => void }>>(({ 
  index, 
  style, 
  data 
}) => {
  const { messages, onMessageClick } = data
  const message = messages[index]

  if (!message) return null

  return (
    <div 
      style={style}
      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
        message.type === 'user' ? 'justify-end' : ''
      }`}
      onClick={() => onMessageClick?.(message)}
    >
      <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}>
        <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
          <div className={`p-3 rounded-lg ${
            message.type === 'user' 
              ? 'bg-blue-500 text-white ml-auto' 
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <p className="text-sm">{message.content}</p>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
})

ChatMessageItem.displayName = 'ChatMessageItem'

// Enhanced Virtual Document List
export const EnhancedVirtualDocumentList: React.FC<VirtualDocumentListProps> = ({
  documents,
  onDocumentSelect,
  selectedDocuments,
  onDocumentToggle,
  height,
  itemHeight = 120,
  className = '',
  searchQuery,
  filterBy = 'all',
  enableVirtualization = true,
  showMetrics = false
}) => {
  const listRef = useRef<List>(null)
  
  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(doc => doc.type === filterBy)
    }

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(doc => 
        doc.name?.toLowerCase().includes(query) ||
        doc.aiAnalysis?.summary?.toLowerCase().includes(query) ||
        doc.aiAnalysis?.keywords?.some(keyword => 
          keyword.toLowerCase().includes(query)
        )
      )
    }

    return filtered
  }, [documents, filterBy, searchQuery])

  // Item data for react-window
  const itemData = useMemo(() => ({
    documents: filteredDocuments,
    onDocumentSelect,
    selectedDocuments,
    onDocumentToggle,
    searchQuery
  }), [filteredDocuments, onDocumentSelect, selectedDocuments, onDocumentToggle, searchQuery])

  // Scroll to selected document
  const scrollToDocument = useCallback((documentId: string) => {
    const index = filteredDocuments.findIndex(doc => doc.id === documentId)
    if (index !== -1 && listRef.current) {
      listRef.current.scrollToItem(index, 'center')
    }
  }, [filteredDocuments])

  // Performance metrics
  const metrics = useMemo(() => {
    if (!showMetrics) return null
    
    return {
      total: documents.length,
      filtered: filteredDocuments.length,
      selected: selectedDocuments.length,
      processed: documents.filter(doc => doc.status === 'ready').length,
      pending: documents.filter(doc => doc.status === 'uploading').length
    }
  }, [documents, filteredDocuments, selectedDocuments, showMetrics])

  // Non-virtualized fallback for small lists
  if (!enableVirtualization || filteredDocuments.length < 50) {
    return (
      <ComponentErrorBoundary name="DocumentList">
        <div className={`${className} overflow-y-auto`} style={{ height }}>
          {showMetrics && metrics && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b text-sm">
              <div className="flex justify-between items-center">
                <span>
                  {metrics.filtered} of {metrics.total} documents
                </span>
                <span className="text-gray-500">
                  {metrics.selected} selected
                </span>
              </div>
            </div>
          )}
          
          {filteredDocuments.map((document, index) => (
            <DocumentItem
              key={document.id}
              index={index}
              style={{}}
              data={itemData}
            />
          ))}
        </div>
      </ComponentErrorBoundary>
    )
  }

  return (
    <ComponentErrorBoundary name="VirtualDocumentList">
      <div className={className}>
        {showMetrics && metrics && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b text-sm">
            <div className="flex justify-between items-center">
              <span>
                {metrics.filtered} of {metrics.total} documents
              </span>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>✓ {metrics.processed}</span>
                <span>⏳ {metrics.pending}</span>
                <span>📋 {metrics.selected} selected</span>
              </div>
            </div>
          </div>
        )}
        
        <List
          ref={listRef}
          height={height - (showMetrics ? 48 : 0)}
          width="100%"
          itemCount={filteredDocuments.length}
          itemSize={itemHeight}
          itemData={itemData}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {DocumentItem}
        </List>
      </div>
    </ComponentErrorBoundary>
  )
}

// Virtual Chat List Component
export const VirtualChatList: React.FC<VirtualChatListProps> = ({
  messages,
  height,
  itemHeight = 80,
  className = '',
  onMessageClick,
  reverseOrder = false
}) => {
  const listRef = useRef<List>(null)
  
  const displayMessages = useMemo(() => {
    return reverseOrder ? [...messages].reverse() : messages
  }, [messages, reverseOrder])

  const itemData = useMemo(() => ({
    messages: displayMessages,
    onMessageClick
  }), [displayMessages, onMessageClick])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && !reverseOrder) {
      listRef.current.scrollToItem(messages.length - 1, 'end')
    }
  }, [messages.length, reverseOrder])

  return (
    <ComponentErrorBoundary name="VirtualChatList">
      <div className={className}>
        <List
          ref={listRef}
          height={height}
          width="100%"
          itemCount={displayMessages.length}
          itemSize={itemHeight}
          itemData={itemData}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {ChatMessageItem}
        </List>
      </div>
    </ComponentErrorBoundary>
  )
}

export default EnhancedVirtualDocumentList
