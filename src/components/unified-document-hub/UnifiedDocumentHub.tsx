/**
 * Unified Document Hub - Main Component
 * 
 * A comprehensive document management interface that combines browse, search, and upload functionality
 */

"use client"

import React, { useState, useCallback } from 'react'
import { 
  Upload, 
  Filter, 
  FileText,
  FolderOpen
} from 'lucide-react'
import { useUnifiedDocuments } from './useUnifiedDocuments'
import { DocumentGrid } from './DocumentGrid'
import { SearchInterface } from './SearchInterface'
import { UploadZone } from './UploadZone'
import { CompactUploadZone } from './CompactUploadZone'
import { FilterPanel } from './FilterPanel'
import { ActionToolbar } from './ActionToolbar'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import { UnifiedDocumentHubProps, UnifiedViewMode } from './types'
import { Document } from '../../rag/types'
import { getSupportedMimeTypes, getSupportedExtensions } from '../../rag/components/document-types/document-types-config'

export function UnifiedDocumentHub({
  className = '',
  initialViewMode = 'browse',
  initialDisplayMode = 'grid',
  onDocumentSelect,
  onDocumentAction,
  showUploadZone = true,
  showAdvancedSearch = true,
  maxUploadSize = 100 * 1024 * 1024, // 100MB
  allowedFileTypes = [...getSupportedMimeTypes(), ...getSupportedExtensions()] // Include both MIME types and extensions
}: UnifiedDocumentHubProps) {
  const {
    viewMode,
    displayMode,
    filteredDocuments,
    selection,
    upload,
    search,
    filters,
    stats,
    availableTags,
    availableTypes,
    isLoading,
    error,
    setViewMode,
    setDisplayMode,
    setFilters,
    performSearch,
    clearSearch,
    toggleSelection,
    toggleSelectAll,
    uploadFiles,
    deleteSelectedDocuments
  } = useUnifiedDocuments()

  // Local UI state
  const [showFilters, setShowFilters] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Initialize with props
  React.useEffect(() => {
    setViewMode(initialViewMode)
    setDisplayMode(initialDisplayMode)
  }, [initialViewMode, initialDisplayMode, setViewMode, setDisplayMode])

  // Handlers
  const handleViewModeChange = useCallback((mode: UnifiedViewMode) => {
    setViewMode(mode)
    
    // Auto-expand search interface when switching to search mode
    if (mode === 'search') {
      setSearchExpanded(true)
    }
  }, [setViewMode])

  const handleSearch = useCallback((query: string) => {
    performSearch(query)
    
    // Auto-switch to search view if not already there
    if (viewMode !== 'search' && query.trim()) {
      setViewMode('search')
    }
  }, [performSearch, viewMode, setViewMode])

  const handleDocumentAction = useCallback((action: string, documentId: string) => {
    const document = filteredDocuments.find(doc => doc.id === documentId)
    
    switch (action) {
      case 'select':
        toggleSelection(documentId)
        break
      case 'preview':
        if (document) {
          setPreviewDocument(document)
          setShowPreviewModal(true)
        }
        break
      case 'download':
        // Implement download functionality
        if (document) {
          onDocumentAction?.(action, [documentId])
        }
        break
      case 'delete':
        onDocumentAction?.(action, [documentId])
        break
      default:
        onDocumentAction?.(action, [documentId])
    }
  }, [toggleSelection, onDocumentAction, filteredDocuments])

  const handleBulkAction = useCallback((action: string) => {
    const selectedIds = Array.from(selection.selectedIds)
    
    switch (action) {
      case 'delete':
        deleteSelectedDocuments()
        break
      default:
        onDocumentAction?.(action, selectedIds)
    }
  }, [selection.selectedIds, deleteSelectedDocuments, onDocumentAction])

  // Determine which components to show based on view mode
  const showSearch = viewMode === 'search' || viewMode === 'hybrid' || searchExpanded
  const showUpload = (viewMode === 'upload' || viewMode === 'hybrid') && showUploadZone
  const showDocuments = viewMode === 'browse' || viewMode === 'search' || viewMode === 'hybrid'

  return (
    <div className={`unified-document-hub flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3 md:p-4 flex-shrink-0">
          <div className="flex">
            <div className="ml-3">
              <p className="text-xs md:text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Mode Switcher and Search */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-4">
              <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FolderOpen className="mr-1.5 md:mr-2 h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                <span className="truncate">Document Hub</span>
              </h1>
              
              {/* Stats */}
              <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                <span className="whitespace-nowrap">{stats.total} docs</span>
                {stats.filtered !== stats.total && (
                  <span className="whitespace-nowrap">({stats.filtered} filtered)</span>
                )}
                {stats.selected > 0 && (
                  <span className="text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {stats.selected} selected
                  </span>
                )}
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                {(['browse', 'search', 'upload', 'hybrid'] as UnifiedViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleViewModeChange(mode)}
                    className={`px-2 md:px-3 py-1 rounded-sm text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                      viewMode === mode
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          {(showSearch || !showDocuments) && (
            <SearchInterface
              query={search.query}
              results={search.results}
              isSearching={search.isSearching}
              suggestions={search.suggestions}
              searchHistory={search.searchHistory}
              onSearch={handleSearch}
              onClearSearch={clearSearch}
              onSuggestionClick={handleSearch}
            />
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex-shrink-0">
        <ActionToolbar
          selection={selection}
          viewMode={viewMode}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          onBulkAction={handleBulkAction}
          onToggleSelectMode={() => {/* Implement */}}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Filter Panel */}
        {showFilters && (
          <div className="w-64 md:w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              documentTypes={availableTypes}
              availableTags={availableTags}
              isExpanded={showFilters}
              onToggleExpanded={() => setShowFilters(!showFilters)}
            />
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Upload Zone - Use compact version when documents exist */}
          {showUpload && (
            <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              {filteredDocuments.length > 0 ? (
                <CompactUploadZone
                  uploadState={upload}
                  onFilesAdded={uploadFiles}
                  onUploadCancel={() => {/* Implement */}}
                  maxFileSize={maxUploadSize}
                  allowedTypes={allowedFileTypes}
                  className="px-3 md:px-6 py-2 md:py-3"
                />
              ) : (
                <UploadZone
                  uploadState={upload}
                  onFilesAdded={uploadFiles}
                  onUploadCancel={() => {/* Implement */}}
                  maxFileSize={maxUploadSize}
                  allowedTypes={allowedFileTypes}
                  className="p-4 md:p-6"
                />
              )}
            </div>
          )}

          {/* Documents Grid/List */}
          {showDocuments && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <DocumentGrid
                documents={filteredDocuments}
                displayMode={displayMode}
                selection={selection}
                onSelectionChange={(changes: Partial<typeof selection>) => {
                  if ('selectedIds' in changes) {
                    // Handle individual selections
                  }
                  if ('selectAll' in changes) {
                    toggleSelectAll()
                  }
                }}
                onDocumentAction={handleDocumentAction}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredDocuments.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <FileText className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm md:text-base font-medium text-gray-900 dark:text-white">
                  No documents found
                </h3>
                <p className="mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {filters.searchQuery 
                    ? 'Try adjusting your search terms or filters'
                    : 'Get started by uploading some documents'
                  }
                </p>
                {showUploadZone && !showUpload && (
                  <button
                    onClick={() => handleViewModeChange('upload')}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Documents
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Floating Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Toggle Filters"
      >
        <Filter className="h-6 w-6" />
      </button>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false)
          setPreviewDocument(null)
        }}
        onDownload={(doc) => onDocumentAction?.('download', [doc.id])}
      />
    </div>
  )
}

export default UnifiedDocumentHub
