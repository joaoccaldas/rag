/**
 * Unified Document Hub - Main State Management Hook
 * 
 * Central hook that manages all document operations, search, and upload functionality
 */

import { useReducer, useCallback, useEffect, useMemo } from 'react'
import { useRAG } from '@/rag/contexts/RAGContext'
import { 
  UnifiedDocumentState, 
  UnifiedDocumentAction, 
  DocumentFilters,
  UnifiedViewMode,
  DocumentDisplayMode,
  SelectionState,
  UnifiedUploadState,
  UnifiedSearchState
} from './types'
import { Document } from '@/rag/types'

// Initial state
const initialFilters: DocumentFilters = {
  searchQuery: '',
  documentTypes: [],
  status: [],
  dateRange: { start: null, end: null },
  tags: [],
  minSimilarity: 0.7,
  maxResults: 50,
  sortBy: 'uploadedAt',
  sortOrder: 'desc'
}

const initialSelection: SelectionState = {
  selectedIds: new Set(),
  selectAll: false,
  isSelectMode: false
}

const initialUploadState: UnifiedUploadState = {
  isUploading: false,
  uploadQueue: [],
  uploadProgress: {},
  recentUploads: []
}

const initialSearchState: UnifiedSearchState = {
  query: '',
  results: [],
  isSearching: false,
  searchHistory: [],
  suggestions: [],
  filters: {}
}

const initialState: UnifiedDocumentState = {
  viewMode: 'browse',
  displayMode: 'grid',
  filters: initialFilters,
  selection: initialSelection,
  upload: initialUploadState,
  search: initialSearchState,
  documents: [],
  filteredDocuments: [],
  isLoading: false,
  error: null
}

// Reducer function
function unifiedDocumentReducer(
  state: UnifiedDocumentState, 
  action: UnifiedDocumentAction
): UnifiedDocumentState {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    
    case 'SET_DISPLAY_MODE':
      return { ...state, displayMode: action.payload }
    
    case 'SET_FILTERS':
      const newFilters = { ...state.filters, ...action.payload }
      return { 
        ...state, 
        filters: newFilters,
        filteredDocuments: applyFilters(state.documents, newFilters)
      }
    
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        search: { ...state.search, query: action.payload },
        filters: { ...state.filters, searchQuery: action.payload }
      }
    
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        search: { ...state.search, results: action.payload, isSearching: false }
      }
    
    case 'SET_SELECTION':
      return {
        ...state,
        selection: { ...state.selection, ...action.payload }
      }
    
    case 'SET_DOCUMENTS':
      return {
        ...state,
        documents: action.payload,
        filteredDocuments: applyFilters(action.payload, state.filters)
      }
    
    case 'ADD_DOCUMENT':
      const updatedDocs = [...state.documents, action.payload]
      return {
        ...state,
        documents: updatedDocs,
        filteredDocuments: applyFilters(updatedDocs, state.filters),
        upload: {
          ...state.upload,
          recentUploads: [action.payload.id, ...state.upload.recentUploads.slice(0, 9)]
        }
      }
    
    case 'UPDATE_DOCUMENT':
      const updated = state.documents.map(doc => 
        doc.id === action.payload.id 
          ? { ...doc, ...action.payload.updates }
          : doc
      )
      return {
        ...state,
        documents: updated,
        filteredDocuments: applyFilters(updated, state.filters)
      }
    
    case 'DELETE_DOCUMENTS':
      const remaining = state.documents.filter(doc => !action.payload.includes(doc.id))
      return {
        ...state,
        documents: remaining,
        filteredDocuments: applyFilters(remaining, state.filters),
        selection: { ...initialSelection }
      }
    
    case 'SET_UPLOAD_STATE':
      return {
        ...state,
        upload: { ...state.upload, ...action.payload }
      }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'RESET_SEARCH':
      return {
        ...state,
        search: { ...initialSearchState },
        filters: { ...state.filters, searchQuery: '' }
      }
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: { ...initialSelection }
      }
    
    default:
      return state
  }
}

// Filter application logic
function applyFilters(documents: Document[], filters: DocumentFilters): Document[] {
  let filtered = [...documents]

  // Text search
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase()
    filtered = filtered.filter(doc => 
      doc.name.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query) ||
      doc.metadata?.title?.toLowerCase().includes(query) ||
      doc.aiAnalysis?.summary?.toLowerCase().includes(query) ||
      doc.aiAnalysis?.keywords?.some(keyword => 
        keyword.toLowerCase().includes(query)
      )
    )
  }

  // Document types
  if (filters.documentTypes.length > 0) {
    filtered = filtered.filter(doc => filters.documentTypes.includes(doc.type))
  }

  // Status filter
  if (filters.status.length > 0) {
    filtered = filtered.filter(doc => filters.status.includes(doc.status))
  }

  // Date range
  if (filters.dateRange.start || filters.dateRange.end) {
    filtered = filtered.filter(doc => {
      const docDate = new Date(doc.uploadedAt)
      if (filters.dateRange.start && docDate < filters.dateRange.start) return false
      if (filters.dateRange.end && docDate > filters.dateRange.end) return false
      return true
    })
  }

  // Tags filter
  if (filters.tags.length > 0) {
    filtered = filtered.filter(doc => 
      doc.aiAnalysis?.tags?.some(tag => filters.tags.includes(tag))
    )
  }

  // Sort
  filtered.sort((a, b) => {
    let aValue: string | number | Date
    let bValue: string | number | Date
    
    switch (filters.sortBy) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'uploadedAt':
        aValue = new Date(a.uploadedAt)
        bValue = new Date(b.uploadedAt)
        break
      case 'size':
        aValue = a.size
        bValue = b.size
        break
      default:
        return 0
    }

    if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Limit results
  return filtered.slice(0, filters.maxResults)
}

// Main hook
export function useUnifiedDocuments() {
  const [state, dispatch] = useReducer(unifiedDocumentReducer, initialState)
  const { 
    documents: ragDocuments, 
    searchDocuments, 
    uploadDocument, 
    deleteDocument,
    uploadProgress 
  } = useRAG()

  // Sync with RAG context
  useEffect(() => {
    dispatch({ type: 'SET_DOCUMENTS', payload: ragDocuments })
  }, [ragDocuments])

  // Sync upload progress
  useEffect(() => {
    dispatch({ 
      type: 'SET_UPLOAD_STATE', 
      payload: { uploadProgress }
    })
  }, [uploadProgress])

  // Action creators
  const setViewMode = useCallback((mode: UnifiedViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }, [])

  const setDisplayMode = useCallback((mode: DocumentDisplayMode) => {
    dispatch({ type: 'SET_DISPLAY_MODE', payload: mode })
  }, [])

  const setFilters = useCallback((filters: Partial<DocumentFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }, [])

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: 'RESET_SEARCH' })
      return
    }

    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const results = await searchDocuments(query)
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results })
      
      // Add to search history
      const currentHistory = state.search.searchHistory
      if (!currentHistory.includes(query)) {
        // Update search history in future implementation
        console.log('Would add to search history:', query)
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Search failed' })
      console.error('Search error:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [searchDocuments, state.search.searchHistory])

  const clearSearch = useCallback(() => {
    dispatch({ type: 'RESET_SEARCH' })
  }, [])

  const toggleSelection = useCallback((documentId: string) => {
    const newSelected = new Set(state.selection.selectedIds)
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId)
    } else {
      newSelected.add(documentId)
    }
    
    dispatch({ 
      type: 'SET_SELECTION', 
      payload: { 
        selectedIds: newSelected,
        selectAll: newSelected.size === state.filteredDocuments.length
      }
    })
  }, [state.selection.selectedIds, state.filteredDocuments.length])

  const toggleSelectAll = useCallback(() => {
    if (state.selection.selectAll) {
      dispatch({ type: 'CLEAR_SELECTION' })
    } else {
      const allIds = new Set(state.filteredDocuments.map(doc => doc.id))
      dispatch({ 
        type: 'SET_SELECTION', 
        payload: { selectedIds: allIds, selectAll: true }
      })
    }
  }, [state.selection.selectAll, state.filteredDocuments])

  const uploadFiles = useCallback(async (files: File[]) => {
    dispatch({ 
      type: 'SET_UPLOAD_STATE', 
      payload: { 
        isUploading: true,
        uploadQueue: [...state.upload.uploadQueue, ...files]
      }
    })

    try {
      for (const file of files) {
        await uploadDocument(file)
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Upload failed' })
      console.error('Upload error:', error)
    } finally {
      dispatch({ 
        type: 'SET_UPLOAD_STATE', 
        payload: { 
          isUploading: false,
          uploadQueue: []
        }
      })
    }
  }, [uploadDocument, state.upload.uploadQueue])

  const deleteSelectedDocuments = useCallback(async () => {
    const selectedIds = Array.from(state.selection.selectedIds)
    if (selectedIds.length === 0) return

    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      await Promise.all(selectedIds.map(id => deleteDocument(id)))
      dispatch({ type: 'DELETE_DOCUMENTS', payload: selectedIds })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Delete failed' })
      console.error('Delete error:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.selection.selectedIds, deleteDocument])

  // Computed values
  const stats = useMemo(() => ({
    total: state.documents.length,
    filtered: state.filteredDocuments.length,
    selected: state.selection.selectedIds.size,
    uploading: state.upload.uploadQueue.length,
    recentUploads: state.upload.recentUploads.length
  }), [
    state.documents.length,
    state.filteredDocuments.length,
    state.selection.selectedIds.size,
    state.upload.uploadQueue.length,
    state.upload.recentUploads.length
  ])

  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    state.documents.forEach(doc => {
      doc.aiAnalysis?.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [state.documents])

  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    state.documents.forEach(doc => types.add(doc.type))
    return Array.from(types).sort()
  }, [state.documents])

  return {
    // State
    ...state,
    stats,
    availableTags,
    availableTypes,
    
    // Actions
    setViewMode,
    setDisplayMode,
    setFilters,
    performSearch,
    clearSearch,
    toggleSelection,
    toggleSelectAll,
    uploadFiles,
    deleteSelectedDocuments,
    
    // Utilities
    dispatch
  }
}
