/**
 * 🎯 OPTIMIZED RAG CONTEXT SELECTORS
 * 
 * Provides granular access to RAG state without causing unnecessary re-renders.
 * Each selector only triggers updates when its specific data changes.
 */

"use client"

import { useMemo } from 'react'
import { Document, SearchResult, ProcessingStats } from '../types'
import { useRAG } from './RAGContext'

// ==================== SELECTOR HOOKS ====================

/**
 * Document-only selector - only re-renders when documents change
 */
export function useDocumentList(): Document[] {
  const { documents } = useRAG()
  return documents
}

/**
 * Document selection selector - only re-renders when selection changes
 */
export function useDocumentSelection() {
  const { selectedDocuments, toggleDocumentSelection, clearSelection } = useRAG()
  return useMemo(() => ({
    selectedDocuments,
    toggleDocumentSelection,
    clearSelection,
    hasSelection: selectedDocuments.length > 0,
    selectionCount: selectedDocuments.length
  }), [selectedDocuments, toggleDocumentSelection, clearSelection])
}

/**
 * Search state selector - only re-renders when search state changes
 */
export function useSearchState() {
  const { searchResults, searchHistory, isSearching, lastQuery, searchDocuments, clearSearchResults } = useRAG()
  return useMemo(() => ({
    searchResults,
    searchHistory,
    isSearching,
    lastQuery,
    searchDocuments,
    clearSearchResults,
    hasResults: searchResults.length > 0,
    resultCount: searchResults.length
  }), [searchResults, searchHistory, isSearching, lastQuery, searchDocuments, clearSearchResults])
}

/**
 * Upload progress selector - only re-renders when upload state changes
 */
export function useUploadState() {
  const { uploadProgress, uploadDocument } = useRAG()
  return useMemo(() => ({
    uploadProgress,
    uploadDocument,
    activeUploads: Object.keys(uploadProgress),
    uploadCount: Object.keys(uploadProgress).length,
    hasActiveUploads: Object.keys(uploadProgress).length > 0
  }), [uploadProgress, uploadDocument])
}

/**
 * Statistics selector - only re-renders when stats change
 */
export function useProcessingStats(): ProcessingStats {
  const { processingStats } = useRAG()
  return processingStats
}

/**
 * Loading state selector - only re-renders when loading state changes
 */
export function useRAGLoadingState() {
  const { isLoading, error } = useRAG()
  return useMemo(() => ({
    isLoading,
    error,
    hasError: !!error
  }), [isLoading, error])
}

/**
 * Document operations selector - for components that need CRUD operations
 */
export function useDocumentOperations() {
  const { 
    addDocument, 
    updateDocument, 
    deleteDocument, 
    deleteSelectedDocuments, 
    refreshDocuments 
  } = useRAG()
  
  return useMemo(() => ({
    addDocument,
    updateDocument,
    deleteDocument,
    deleteSelectedDocuments,
    refreshDocuments
  }), [addDocument, updateDocument, deleteDocument, deleteSelectedDocuments, refreshDocuments])
}

// ==================== COMPOSITE SELECTORS ====================

/**
 * Document management composite - combines documents and operations
 */
export function useDocumentManagement() {
  const documents = useDocumentList()
  const selection = useDocumentSelection()
  const operations = useDocumentOperations()
  const loading = useRAGLoadingState()
  
  return useMemo(() => ({
    documents,
    ...selection,
    ...operations,
    ...loading,
    
    // Computed properties
    documentCount: documents.length,
    hasDocuments: documents.length > 0,
    processingDocuments: documents.filter(doc => doc.status === 'processing'),
    completedDocuments: documents.filter(doc => doc.status === 'ready'),
    failedDocuments: documents.filter(doc => doc.status === 'error')
  }), [documents, selection, operations, loading])
}

/**
 * Search management composite - combines search state and operations
 */
export function useSearchManagement() {
  const searchState = useSearchState()
  const documents = useDocumentList()
  const loading = useRAGLoadingState()
  
  return useMemo(() => ({
    ...searchState,
    isLoading: loading.isLoading,
    error: loading.error,
    
    // Computed properties
    searchableDocuments: documents.filter(doc => doc.status === 'ready'),
    searchableDocumentCount: documents.filter(doc => doc.status === 'ready').length,
    canSearch: documents.filter(doc => doc.status === 'ready').length > 0
  }), [searchState, documents, loading])
}

/**
 * Upload management composite - combines upload state and document operations
 */
export function useUploadManagement() {
  const uploadState = useUploadState()
  const operations = useDocumentOperations()
  const loading = useRAGLoadingState()
  
  return useMemo(() => ({
    ...uploadState,
    addDocument: operations.addDocument,
    isLoading: loading.isLoading,
    error: loading.error,
    
    // Computed properties
    canUpload: !loading.isLoading,
    uploadInProgress: uploadState.hasActiveUploads
  }), [uploadState, operations, loading])
}

// ==================== UTILITY SELECTORS ====================

/**
 * Performance-optimized document finder
 */
export function useDocumentById(id: string): Document | undefined {
  const documents = useDocumentList()
  return useMemo(() => 
    documents.find(doc => doc.id === id), 
    [documents, id]
  )
}

/**
 * Performance-optimized document filter
 */
export function useDocumentsByStatus(status: Document['status']): Document[] {
  const documents = useDocumentList()
  return useMemo(() => 
    documents.filter(doc => doc.status === status), 
    [documents, status]
  )
}

/**
 * Search result by ID
 */
export function useSearchResultById(id: string): SearchResult | undefined {
  const { searchResults } = useSearchState()
  return useMemo(() => 
    searchResults.find(result => result.document?.id === id), 
    [searchResults, id]
  )
}

// ==================== EXPORT ALL SELECTORS ====================

export const RAGSelectors = {
  // Basic selectors
  useDocumentList,
  useDocumentSelection,
  useSearchState,
  useUploadState,
  useProcessingStats,
  useRAGLoadingState,
  useDocumentOperations,
  
  // Composite selectors
  useDocumentManagement,
  useSearchManagement,
  useUploadManagement,
  
  // Utility selectors
  useDocumentById,
  useDocumentsByStatus,
  useSearchResultById
}
