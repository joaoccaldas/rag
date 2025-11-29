/**
 * Document Grid Component - Enhanced with virtual scrolling and performance optimizations
 */

"use client"

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { DocumentGridProps } from './types'
import { Document } from '../../rag/types'
import { 
  FileText, Calendar, HardDrive, CheckSquare, Square, Eye, Download, 
  Trash2
} from 'lucide-react'
import { useVirtualScroll } from '../../hooks/performance-optimization'
import { CitationButton } from '../citations'

// Enhanced Document Card Component with styling matching existing DocumentCard
function EnhancedDocumentCard({ 
  document, 
  isSelected, 
  onDocumentAction 
}: {
  document: Document
  isSelected: boolean
  onDocumentAction: (action: string, id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = bytes / Math.pow(k, i)
    return i >= 2 ? `${size.toFixed(2)} ${sizes[i]}` : `${Math.round(size)} ${sizes[i]}`
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  const fileType = document.type?.split('/')[1]?.toUpperCase() || 
                   document.name?.split('.').pop()?.toUpperCase() || 'DOC'

  const StatusBadge = () => (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
        document.status === 'ready'
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
          : document.status === 'processing'
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      }`}
    >
      {document.status || 'ready'}
    </span>
  )

  return (
    <div
      className={`relative group w-full min-h-[320px] flex flex-col overflow-hidden rounded-2xl
        bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60
        shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${
        isSelected
          ? 'ring-2 ring-blue-500/70 shadow-lg bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-800'
          : ''
      }`}
    >
      {/* Header with thumbnail/icon */}
      <div className="relative h-20 w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700">
        {/* Display visual content thumbnail if available */}
        {document.visualContent?.[0]?.thumbnail ? (
          <Image 
            src={document.visualContent[0].thumbnail}
            alt={document.visualContent[0].title ?? document.name ?? 'Document thumbnail'}
            fill
            className="object-cover"
            unoptimized={document.visualContent[0].thumbnail.startsWith('data:')}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 pointer-events-none" />

        {/* Selection checkbox */}
        <div className="absolute top-2 left-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDocumentAction('select', document.id)
            }}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-white/85 dark:bg-gray-900/65 shadow-sm backdrop-blur hover:bg-white dark:hover:bg-gray-800 transition"
            aria-label={isSelected ? 'Unselect document' : 'Select document'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-95 group-hover:opacity-100">
          <CitationButton 
            document={document}
            variant="icon"
            className="h-7 w-7 p-1 rounded-md shadow-sm backdrop-blur bg-white/85 dark:bg-gray-900/65 hover:bg-white dark:hover:bg-gray-800 transition text-gray-600 hover:text-gray-800"
          />
          {[
            { Icon: Eye, action: 'preview', title: 'Preview' },
            { Icon: Download, action: 'download', title: 'Download' },
            { Icon: Trash2, action: 'delete', title: 'Delete', danger: true }
          ].map(({ Icon, action, title, danger }) => (
            <button
              key={action}
              onClick={(e) => {
                e.stopPropagation()
                onDocumentAction(action, document.id)
              }}
              className={`h-7 w-7 p-1 rounded-md shadow-sm backdrop-blur bg-white/85 dark:bg-gray-900/65 hover:bg-white dark:hover:bg-gray-800 transition ${
                danger ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-800'
              }`}
              title={title}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 pt-3 pb-4 grid grid-rows-[auto_auto_auto_1fr_auto] gap-2.5 min-h-0">
        {/* Title */}
        <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 tracking-tight">
          {document.name || 'Untitled Document'}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-0.5 font-medium text-gray-700 dark:text-gray-200">
            {fileType}
          </span>
          {document.chunks?.length && (
            <>
              <span className="text-gray-400">•</span>
              <span>{document.chunks.length} chunks</span>
            </>
          )}
          {document.visualContent?.length && (
            <>
              <span className="text-gray-400">•</span>
              <span className="inline-flex items-center gap-1">
                📊 {document.visualContent.length} visual{document.visualContent.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
          <span className="flex-1" />
          <StatusBadge />
        </div>

        {/* AI Summary */}
        {document.aiAnalysis?.summary && (
          <div className="rounded-xl border border-blue-200/60 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/15 p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-blue-700 dark:text-blue-300">
                AI Summary
              </div>
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-xs text-blue-700/85 dark:text-blue-300 hover:underline"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            </div>
            <p className={`mt-1.5 text-sm text-gray-800 dark:text-gray-300 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {document.aiAnalysis.summary}
            </p>
            {document.aiAnalysis.confidence != null && (
              <div className="mt-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {Math.round(document.aiAnalysis.confidence * 100)}% confidence
              </div>
            )}
          </div>
        )}

        {/* Keywords */}
        {document.aiAnalysis?.keywords?.length ? (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {document.aiAnalysis.keywords.slice(0, 8).map((keyword: string, i: number) => (
              <span
                key={i}
                className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
              >
                {keyword.length > 16 ? `${keyword.slice(0, 16)}…` : keyword}
              </span>
            ))}
            {document.aiAnalysis.keywords.length > 8 && (
              <span className="text-[11px] px-2.5 py-1 rounded-full text-gray-500 border border-dashed border-gray-300">
                +{document.aiAnalysis.keywords.length - 8}
              </span>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Footer */}
        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200/70 dark:border-gray-700/60">
          <div className="flex items-center gap-2 pt-2 min-w-0">
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {formatFileSize(document.size || 0)}
            </span>
            <span className="text-gray-400">•</span>
            <span className="truncate">
              {formatDate(document.uploadedAt)}
            </span>
          </div>

          {document.status === 'processing' && (
            <div className="w-28 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full w-3/5 rounded-full bg-blue-500 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function DocumentGrid({
  documents,
  displayMode,
  selection,
  onDocumentAction,
  isLoading
}: DocumentGridProps) {
  const CARD_HEIGHT = 320 // Height of each card in pixels
  const CONTAINER_HEIGHT = 600 // Estimated visible height
  
  // Virtual scrolling for grid view when there are many documents
  const virtualScroll = useVirtualScroll(documents.length, {
    itemHeight: CARD_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 2
  })

  // Memoize visible documents for performance
  const visibleDocuments = useMemo(() => {
    if (displayMode === 'grid' && documents.length > 20) {
      return documents.slice(virtualScroll.startIndex, virtualScroll.endIndex + 1)
    }
    return documents
  }, [documents, displayMode, virtualScroll.startIndex, virtualScroll.endIndex])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (displayMode === 'grid') {
    // For large document sets, use virtual scrolling
    if (documents.length > 20) {
      return (
        <div
          ref={virtualScroll.containerRef}
          className="h-full overflow-auto"
          onScroll={virtualScroll.handleScroll}
        >
          <div style={{ height: virtualScroll.totalHeight, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: virtualScroll.startIndex * CARD_HEIGHT,
                width: '100%'
              }}
              className="p-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleDocuments.map((document) => (
                  <div key={document.id} style={{ height: CARD_HEIGHT }}>
                    <EnhancedDocumentCard
                      document={document}
                      isSelected={selection.selectedIds.has(document.id)}
                      onDocumentAction={onDocumentAction}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Regular grid for smaller document sets
    return (
      <div className="h-full overflow-auto">
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documents.map((document) => (
              <EnhancedDocumentCard
                key={document.id}
                document={document}
                isSelected={selection.selectedIds.has(document.id)}
                onDocumentAction={onDocumentAction}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Enhanced List view
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = bytes / Math.pow(k, i)
    return i >= 2 ? `${size.toFixed(2)} ${sizes[i]}` : `${Math.round(size)} ${sizes[i]}`
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 ${
                selection.selectedIds.has(document.id)
                  ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => onDocumentAction('select', document.id)}
            >
              <input
                type="checkbox"
                checked={selection.selectedIds.has(document.id)}
                onChange={() => onDocumentAction('select', document.id)}
                className="rounded border-gray-300"
                onClick={(e) => e.stopPropagation()}
              />
              <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {document.name || 'Untitled Document'}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  {formatFileSize(document.size || 0)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(document.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDocumentAction('preview', document.id)
                }}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDocumentAction('download', document.id)
                }}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDocumentAction('delete', document.id)
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          ))}
        </div>
      </div>
    </div>
  )
}
