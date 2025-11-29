"use client"

import React, { createContext, useContext, useCallback } from 'react'
import { Document, SearchResult, UploadProgress, ProcessingStats } from '../types'

// Import specialized context providers and hooks
import { 
  DocumentManagementProvider, 
  useDocumentManagement 
} from './DocumentManagementContext'
import { 
  UploadProcessingProvider, 
  useUploadProcessing 
} from './UploadProcessingContext'
import { 
  SearchProvider, 
  useSearch 
} from './UnifiedSearchContext'
import { 
  StatisticsProvider, 
  useStatistics 
} from './StatisticsContext'

// Unified interface that combines all RAG functionality
interface RAGContextType {
  // Document Management
  documents: Document[]
  selectedDocuments: string[]
  addDocument: (document: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  deleteSelectedDocuments: () => Promise<void>
  toggleDocumentSelection: (id: string) => void
  clearSelection: () => void
  refreshDocuments: () => Promise<void>
  
  // Upload Processing
  uploadProgress: Record<string, UploadProgress>
  uploadDocument: (file: File) => Promise<void>
  
  // Search
  searchResults: SearchResult[]
  searchHistory: string[]
  isSearching: boolean
  lastQuery: string
  searchDocuments: (query: string) => Promise<SearchResult[]>
  clearSearchResults: () => void
  
  // Statistics
  processingStats: ProcessingStats
  updateStatistics: (documents: Document[]) => void
  
  // Combined state
  isLoading: boolean
  error: string | null
}

const RAGContext = createContext<RAGContextType | null>(null)

// Inner component that uses all specialized hooks
function RAGProviderInner({ children }: { children: React.ReactNode }) {
  const documentManagement = useDocumentManagement()
  const uploadProcessing = useUploadProcessing()
  const search = useSearch()
  const statistics = useStatistics()

  // Update statistics whenever documents change
  React.useEffect(() => {
    statistics.updateStatistics(documentManagement.documents)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentManagement.documents, statistics.updateStatistics])

  const uploadDocument = useCallback(async (file: File) => {
    await uploadProcessing.processDocument(file, (document: Document) => {
      documentManagement.addDocument(document)
    })
  }, [uploadProcessing, documentManagement])

  const searchDocuments = useCallback(async (query: string) => {
    console.log(`🔍 RAGContext: Starting search for "${query}"`)
    console.log(`📚 Available documents for search: ${documentManagement.documents.length}`)
    
    // Debug document status
    const docStatus = documentManagement.documents.map(doc => ({
      name: doc.name,
      status: doc.status,
      hasChunks: !!doc.chunks,
      chunkCount: doc.chunks?.length || 0,
      isEmployeeDoc: doc.name.toLowerCase().includes('employee')
    }))
    
    console.log('📋 Documents being passed to search:', docStatus)
    
    // Specifically check for employee document
    const employeeDoc = documentManagement.documents.find(doc => 
      doc.name.toLowerCase().includes('employee') && doc.name.toLowerCase().includes('agreement')
    )
    
    if (employeeDoc) {
      console.log('🎯 Employee document found in RAGContext:', {
        name: employeeDoc.name,
        status: employeeDoc.status,
        hasChunks: !!employeeDoc.chunks,
        chunkCount: employeeDoc.chunks?.length || 0,
        firstChunkPreview: employeeDoc.chunks?.[0]?.content?.substring(0, 100)
      })
    } else {
      console.warn('❌ Employee agreement document NOT FOUND in RAGContext documents')
    }
    
    // Use the search context's searchDocuments method
    const results = await search.searchDocuments(query, documentManagement.documents)
    return results
  }, [search, documentManagement.documents])

  // Combine loading states
  const isLoading = documentManagement.state.isLoading || 
                   uploadProcessing.state.isProcessing || 
                   search.isSearching || 
                   statistics.state.isCalculating

  // Combine error states (prioritize non-null errors)
  const error = documentManagement.state.error || 
               uploadProcessing.state.error || 
               null ||  // search context doesn't have error state
               statistics.state.error

  const value: RAGContextType = React.useMemo(() => ({
    // Document Management
    documents: documentManagement.documents,
    selectedDocuments: documentManagement.selectedDocuments,
    addDocument: documentManagement.addDocument,
    updateDocument: documentManagement.updateDocument,
    deleteDocument: documentManagement.deleteDocument,
    deleteSelectedDocuments: documentManagement.deleteSelectedDocuments,
    toggleDocumentSelection: documentManagement.toggleDocumentSelection,
    clearSelection: documentManagement.clearSelection,
    refreshDocuments: documentManagement.refreshDocuments,
    
    // Upload Processing
    uploadProgress: uploadProcessing.uploadProgress,
    uploadDocument,
    
    // Search
    searchResults: search.searchResults,
    searchHistory: search.searchHistory,
    isSearching: search.isSearching,
    lastQuery: search.lastQuery,
    searchDocuments,
    clearSearchResults: search.clearResults,
    
    // Statistics
    processingStats: statistics.processingStats,
    updateStatistics: statistics.updateStatistics,
    
    // Combined state
    isLoading,
    error
  }), [
    documentManagement.documents,
    documentManagement.selectedDocuments,
    documentManagement.addDocument,
    documentManagement.updateDocument,
    documentManagement.deleteDocument,
    documentManagement.deleteSelectedDocuments,
    documentManagement.toggleDocumentSelection,
    documentManagement.clearSelection,
    documentManagement.refreshDocuments,
    uploadProcessing.uploadProgress,
    uploadDocument,
    search.searchResults,
    search.searchHistory,
    search.isSearching,
    search.lastQuery,
    searchDocuments,
    search.clearResults,
    statistics.processingStats,
    statistics.updateStatistics,
    isLoading,
    error
  ])

  return (
    <RAGContext.Provider value={value}>
      {children}
    </RAGContext.Provider>
  )
}

// Main provider that wraps all specialized providers
export function RAGProvider({ children }: { children: React.ReactNode }) {
  return (
    <DocumentManagementProvider>
      <UploadProcessingProvider>
        <SearchProvider>
          <StatisticsProvider>
            <RAGProviderInner>
              {children}
            </RAGProviderInner>
          </StatisticsProvider>
        </SearchProvider>
      </UploadProcessingProvider>
    </DocumentManagementProvider>
  )
}

// Hook to use the unified RAG context
export function useRAG() {
  const context = useContext(RAGContext)
  if (!context) {
    throw new Error('useRAG must be used within a RAGProvider')
  }
  return context
}

// Export individual hooks for specialized use cases
export { useDocumentManagement } from './DocumentManagementContext'
export { useUploadProcessing } from './UploadProcessingContext'
export { useSearch } from './UnifiedSearchContext'
export { useStatistics } from './StatisticsContext'
