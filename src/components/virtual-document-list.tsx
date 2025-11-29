/**
 * Virtual Document List Component
 * Efficiently renders large lists of documents using react-window
 */

"use client"

import React, { useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { FileText, File, Archive, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { Document, DocumentType } from '../rag/types'

interface VirtualDocumentListProps {
  documents: Document[]
  onDocumentSelect: (document: Document) => void
  selectedDocuments: string[]
  onDocumentToggle: (documentId: string) => void
  height: number
  itemHeight?: number
  className?: string
}

interface DocumentItemProps {
  index: number
  style: React.CSSProperties
  data: {
    documents: Document[]
    onDocumentSelect: (document: Document) => void
    selectedDocuments: string[]
    onDocumentToggle: (documentId: string) => void
  }
}

const getDocumentIcon = (type: DocumentType) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-red-500" />
    case 'docx':
      return <File className="w-5 h-5 text-blue-500" />
    case 'txt':
    case 'markdown':
      return <FileText className="w-5 h-5 text-gray-500" />
    case 'xlsx':
    case 'csv':
      return <File className="w-5 h-5 text-green-500" />
    case 'json':
      return <File className="w-5 h-5 text-yellow-500" />
    default:
      return <File className="w-5 h-5 text-gray-400" />
  }
}

const getStatusIcon = (status: Document['status']) => {
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
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`
  return date.toLocaleDateString()
}

const DocumentItem = React.memo(({ index, style, data }: DocumentItemProps) => {
  const { documents, onDocumentSelect, selectedDocuments, onDocumentToggle } = data
  const document = documents[index]
  
  if (!document) {
    return (
      <div style={style} className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  const isSelected = selectedDocuments.includes(document.id)
  const chunkCount = document.chunks?.length || 0

  return (
    <div
      style={style}
      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''
      }`}
      onClick={() => onDocumentSelect(document)}
    >
      <div className="flex items-start space-x-3">
        {/* Selection Checkbox */}
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onDocumentToggle(document.id)
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {/* Document Icon */}
        <div className="flex-shrink-0 pt-1">
          {getDocumentIcon(document.type)}
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {document.name}
            </h3>
            <div className="flex items-center space-x-2">
              {getStatusIcon(document.status)}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(document.size)}
              </span>
            </div>
          </div>

          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{document.type.toUpperCase()}</span>
            <span>{chunkCount} chunks</span>
            <span>{formatDate(document.uploadedAt)}</span>
          </div>

          {/* AI Analysis Preview */}
          {document.aiAnalysis && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex flex-wrap gap-1">
                {document.aiAnalysis.keywords.slice(0, 3).map((keyword, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
                {document.aiAnalysis.keywords.length > 3 && (
                  <span className="px-2 py-1 text-gray-400">
                    +{document.aiAnalysis.keywords.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {document.status === 'error' && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              Processing failed - click to retry
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

DocumentItem.displayName = 'DocumentItem'

export function VirtualDocumentList({
  documents,
  onDocumentSelect,
  selectedDocuments,
  onDocumentToggle,
  height,
  itemHeight = 120,
  className = ''
}: VirtualDocumentListProps) {
  const itemData = useMemo(() => ({
    documents,
    onDocumentSelect,
    selectedDocuments,
    onDocumentToggle
  }), [documents, onDocumentSelect, selectedDocuments, onDocumentToggle])

  const renderItem = useCallback(
    (props: { index: number; style: React.CSSProperties }) => (
      <DocumentItem {...props} data={itemData} />
    ),
    [itemData]
  )

  if (documents.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No documents found</p>
          <p className="text-sm">Upload some documents to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={documents.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5}
        width="100%"
      >
        {renderItem}
      </List>
    </div>
  )
}
