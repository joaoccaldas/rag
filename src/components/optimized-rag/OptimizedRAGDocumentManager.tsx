/**
 * 🎯 OPTIMIZED RAG DOCUMENT MANAGER
 * 
 * High-performance document management with virtual scrolling,
 * memoized filtering, and optimized sel        📊 Docs: {documents.length} | Filtered: {filteredDocuments.length} | 
        Selected: {baseSelection.selectedCount} | Mode: {displayMode}tion handling.
 */

"use client"

import React, { useMemo, useCallback } from 'react'
import { Document } from '../../rag/types'
import { 
  useOptimizedDocumentFilter, 
  useOptimizedSelection,
  usePerformanceMonitor 
} from '../../hooks/performance-optimization'
import { useDocumentManagement } from '../../rag/contexts/RAGSelectors'
import { DocumentGrid } from '../unified-document-hub/DocumentGrid'
import { FilterPanel } from '../unified-document-hub/FilterPanel'
import { ActionToolbar } from '../unified-document-hub/ActionToolbar'
import { DocumentFilters } from '../unified-document-hub/types'

interface OptimizedRAGDocumentManagerProps {
  className?: string
  showFilters?: boolean
  initialDisplayMode?: 'grid' | 'list'
  onDocumentSelect?: (document: Document) => void
  onDocumentAction?: (action: string, documentIds: string[]) => void
}

export const OptimizedRAGDocumentManager = React.memo<OptimizedRAGDocumentManagerProps>(({
  className = '',
  showFilters = true,
  initialDisplayMode = 'grid',
  onDocumentSelect,
  onDocumentAction
}) => {
  // Performance monitoring
  usePerformanceMonitor('OptimizedRAGDocumentManager')
  
  // Get document data from optimized selectors
  const { 
    documents, 
    isLoading, 
    hasDocuments,
    completedDocuments,
    processingDocuments 
  } = useDocumentManagement()

  // Local state for UI
  const [displayMode, setDisplayMode] = React.useState<'grid' | 'list'>(initialDisplayMode)
  const [showFilterPanel, setShowFilterPanel] = React.useState(showFilters)
  const [filters, setFilters] = React.useState<DocumentFilters>({
    searchQuery: '',
    documentTypes: [],
    status: [],
    dateRange: { start: null, end: null },
    tags: [],
    minSimilarity: 0,
    maxResults: 100,
    sortBy: 'uploadedAt',
    sortOrder: 'desc'
  })

  // Optimized document filtering
  const filteredDocuments = useOptimizedDocumentFilter(documents, {
    searchQuery: filters.searchQuery,
    types: filters.documentTypes,
    statuses: filters.status,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  })

  // Optimized selection management
  const baseSelection = useOptimizedSelection(filteredDocuments)
  
  // Extend selection to match required interface
  const selection = React.useMemo(() => ({
    selectedIds: baseSelection.selectedIds,
    selectAll: baseSelection.isAllSelected,
    isSelectMode: baseSelection.selectedCount > 0
  }), [baseSelection])

  // Handle display mode changes
  const handleDisplayModeChange = React.useCallback((mode: 'grid' | 'list' | 'table') => {
    if (mode === 'table') {
      setDisplayMode('list') // Fallback table to list
    } else {
      setDisplayMode(mode)
    }
  }, [])

  // Available filter options (memoized)
  const availableTypes = useMemo(() => 
    [...new Set(documents.map(doc => doc.type).filter(Boolean))],
    [documents]
  )

  const availableTags = useMemo(() => 
    [...new Set(documents.flatMap(doc => doc.aiAnalysis?.tags || []))],
    [documents]
  )

  // Document action handler
  const handleDocumentAction = useCallback((action: string, documentId: string) => {
    const document = filteredDocuments.find(doc => doc.id === documentId)
    
    switch (action) {
      case 'select':
        baseSelection.toggleSelection(documentId)
        if (document && onDocumentSelect) {
          onDocumentSelect(document)
        }
        break
      case 'preview':
      case 'download':
      case 'delete':
        if (onDocumentAction) {
          onDocumentAction(action, [documentId])
        }
        break
      default:
        console.log(`Unknown action: ${action}`)
    }
  }, [filteredDocuments, baseSelection, onDocumentSelect, onDocumentAction])

  // Bulk action handler
  const handleBulkAction = useCallback((action: string) => {
    const selectedIds = Array.from(baseSelection.selectedIds)
    if (selectedIds.length > 0 && onDocumentAction) {
      onDocumentAction(action, selectedIds)
    }
  }, [baseSelection.selectedIds, onDocumentAction])

  // Filter changes handler
  const handleFiltersChange = useCallback((newFilters: Partial<DocumentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading documents...</span>
      </div>
    )
  }

  return (
    <div className={`optimized-rag-document-manager flex flex-col h-full ${className}`}>
      {/* Performance Stats (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-2 text-xs">
          📊 Docs: {documents.length} | Filtered: {filteredDocuments.length} | 
          Selected: {selection.selectedCount} | Mode: {displayMode}
        </div>
      )}

      {/* Action Toolbar */}
      <ActionToolbar
        selection={selection}
        viewMode="browse"
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        onBulkAction={handleBulkAction}
        onToggleSelectMode={() => {
          if (selection.isNoneSelected) {
            selection.selectAll()
          } else {
            selection.clearSelection()
          }
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              documentTypes={availableTypes}
              availableTags={availableTags}
              isExpanded={showFilterPanel}
              onToggleExpanded={() => setShowFilterPanel(!showFilterPanel)}
            />
          </div>
        )}

        {/* Document Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Status Summary */}
          {hasDocuments && (
            <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Total: <strong>{documents.length}</strong></span>
                <span>•</span>
                <span>Completed: <strong className="text-green-600">{completedDocuments.length}</strong></span>
                <span>•</span>
                <span>Processing: <strong className="text-blue-600">{processingDocuments.length}</strong></span>
                <span>•</span>
                <span>Showing: <strong>{filteredDocuments.length}</strong></span>
                {selection.selectedCount > 0 && (
                  <>
                    <span>•</span>
                    <span>Selected: <strong className="text-blue-600">{selection.selectedCount}</strong></span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Document Grid with Virtual Scrolling */}
          <DocumentGrid
            documents={filteredDocuments}
            displayMode={displayMode}
            selection={selection}
            onDocumentAction={handleDocumentAction}
            isLoading={false}
          />

          {/* Empty State */}
          {!hasDocuments && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  📄
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No documents yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Get started by uploading your first document
                </p>
              </div>
            </div>
          )}

          {/* No Results State */}
          {hasDocuments && filteredDocuments.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  🔍
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No documents found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, searchQuery: '', documentTypes: [], status: [] }))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

OptimizedRAGDocumentManager.displayName = 'OptimizedRAGDocumentManager'

export default OptimizedRAGDocumentManager
