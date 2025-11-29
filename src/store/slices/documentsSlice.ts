/**
 * Documents Slice - Central Document State Management
 * 
 * This replaces the fragmented DocumentManagementContext with a unified
 * state management solution using Redux Toolkit.
 * 
 * Phase 1 Implementation: Basic document CRUD operations with optimistic updates
 * 
 * Why this approach:
 * - Immutable updates with Immer (built into createSlice)
 * - Predictable state changes with reducers
 * - Time-travel debugging support
 * - Automatic action creators
 * - Better TypeScript integration
 * - Undo/Redo capability foundation
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import { Document, DocumentType, DocumentStatus } from '../../rag/types'
import type { RootState } from '../index'

// Enhanced document interface with additional metadata
interface EnhancedDocument extends Document {
  // Processing metadata
  processingStartTime?: number
  processingEndTime?: number
  processingDuration?: number
  
  // User interaction metadata
  lastViewedAt?: number
  viewCount?: number
  searchRelevanceScore?: number
  
  // Collaboration metadata
  lastModifiedBy?: string
  version?: number
  isLocked?: boolean
  lockExpiresAt?: number
}

interface DocumentsState {
  // Core data - normalized state for O(1) lookups
  items: Record<string, EnhancedDocument>
  ids: string[]
  
  // Selection and filtering
  selectedIds: string[]
  searchQuery: string
  filterCriteria: {
    type?: DocumentType[]
    status?: DocumentStatus[]
    dateRange?: { start: Date; end: Date }
    tags?: string[]
  }
  
  // UI state
  viewMode: 'grid' | 'list' | 'table'
  sortBy: 'name' | 'date' | 'size' | 'type' | 'relevance'
  sortOrder: 'asc' | 'desc'
  
  // Loading states
  isLoading: boolean
  isLoadingDocument: Record<string, boolean>
  isSaving: boolean
  
  // Error handling
  error: string | null
  
  // Bulk operations
  bulkOperations: {
    isRunning: boolean
    operation: 'delete' | 'reprocess' | 'export' | null
    progress: number
    affectedIds: string[]
  }
  
  // Statistics
  totalSize: number
  processingQueue: number
  lastSyncTime: number | null
  
  // Optimistic updates tracking
  optimisticUpdates: Record<string, {
    type: 'create' | 'update' | 'delete'
    timestamp: number
    originalData?: EnhancedDocument
  }>
}

const initialState: DocumentsState = {
  items: {},
  ids: [],
  selectedIds: [],
  searchQuery: '',
  filterCriteria: {},
  viewMode: 'grid',
  sortBy: 'date',
  sortOrder: 'desc',
  isLoading: false,
  isLoadingDocument: {},
  isSaving: false,
  error: null,
  bulkOperations: {
    isRunning: false,
    operation: null,
    progress: 0,
    affectedIds: []
  },
  totalSize: 0,
  processingQueue: 0,
  lastSyncTime: null,
  optimisticUpdates: {}
}

// ================ ASYNC THUNKS ================

/**
 * Load all documents from storage
 */
export const loadDocuments = createAsyncThunk(
  'documents/loadAll',
  async (_, { rejectWithValue }) => {
    try {
      // Phase 1: Return empty array, will integrate storage later
      const documents: Document[] = []
      return documents
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load documents')
    }
  }
)

/**
 * Save a single document with optimistic updates
 */
export const saveDocument = createAsyncThunk(
  'documents/save',
  async (document: Document, { rejectWithValue }) => {
    try {
      const enhancedDoc: EnhancedDocument = {
        ...document,
        lastViewedAt: Date.now(),
        viewCount: 0,
        version: 1
      }
      
      // Phase 1: Just return the document, will integrate storage later
      return enhancedDoc
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save document')
    }
  }
)

/**
 * Update document status
 */
export const updateDocumentStatus = createAsyncThunk(
  'documents/updateStatus',
  async ({ id, status }: { id: string; status: DocumentStatus }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const document = state.documents.items[id]
      
      if (!document) {
        throw new Error(`Document ${id} not found`)
      }
      
      const updatedDoc: EnhancedDocument = {
        ...document,
        status,
        lastModified: new Date(),
        version: document.version ? document.version + 1 : 1
      }
      
      return updatedDoc
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update status')
    }
  }
)

/**
 * Delete documents
 */
export const deleteDocuments = createAsyncThunk(
  'documents/delete',
  async (ids: string[], { rejectWithValue }) => {
    try {
      // Phase 1: Just return the IDs, will integrate storage later
      return ids
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete documents')
    }
  }
)

/**
 * Search documents
 */
export const searchDocuments = createAsyncThunk(
  'documents/search',
  async (query: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const allDocuments = Object.values(state.documents.items)
      
      // Simple text search
      const results = allDocuments.filter(doc => 
        doc.name.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase())
      )
      
      return { query, results }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Search failed')
    }
  }
)

// ================ SLICE DEFINITION ================

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // Document selection
    toggleDocumentSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const index = state.selectedIds.indexOf(id)
      
      if (index === -1) {
        state.selectedIds.push(id)
      } else {
        state.selectedIds.splice(index, 1)
      }
    },
    
    selectAllDocuments: (state) => {
      state.selectedIds = [...state.ids]
    },
    
    clearSelection: (state) => {
      state.selectedIds = []
    },
    
    // Search and filtering
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    
    setFilterCriteria: (state, action: PayloadAction<Partial<DocumentsState['filterCriteria']>>) => {
      state.filterCriteria = { ...state.filterCriteria, ...action.payload }
    },
    
    clearFilters: (state) => {
      state.filterCriteria = {}
      state.searchQuery = ''
    },
    
    // View mode and sorting
    setViewMode: (state, action: PayloadAction<DocumentsState['viewMode']>) => {
      state.viewMode = action.payload
    },
    
    setSorting: (state, action: PayloadAction<{ sortBy: DocumentsState['sortBy']; sortOrder: DocumentsState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
      
      // Re-sort the IDs array
      const sortedIds = Object.values(state.items)
        .sort((a, b) => {
          let aVal: string | number, bVal: string | number
          
          switch (action.payload.sortBy) {
            case 'name':
              aVal = a.name.toLowerCase()
              bVal = b.name.toLowerCase()
              break
            case 'date':
              aVal = a.uploadedAt.getTime()
              bVal = b.uploadedAt.getTime()
              break
            case 'size':
              aVal = a.size
              bVal = b.size
              break
            case 'type':
              aVal = a.type
              bVal = b.type
              break
            case 'relevance':
              aVal = a.searchRelevanceScore || 0
              bVal = b.searchRelevanceScore || 0
              break
            default:
              aVal = a.uploadedAt.getTime()
              bVal = b.uploadedAt.getTime()
          }
          
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          return action.payload.sortOrder === 'asc' ? comparison : -comparison
        })
        .map(doc => doc.id)
      
      state.ids = sortedIds
    },
    
    // Optimistic updates
    addOptimisticUpdate: (state, action: PayloadAction<{ 
      id: string
      type: 'create' | 'update' | 'delete'
      originalData?: EnhancedDocument 
    }>) => {
      state.optimisticUpdates[action.payload.id] = {
        ...action.payload,
        timestamp: Date.now()
      }
    },
    
    removeOptimisticUpdate: (state, action: PayloadAction<string>) => {
      delete state.optimisticUpdates[action.payload]
    },
    
    // Bulk operations
    startBulkOperation: (state, action: PayloadAction<{
      operation: 'delete' | 'reprocess' | 'export'
      affectedIds: string[]
    }>) => {
      state.bulkOperations = {
        isRunning: true,
        operation: action.payload.operation,
        progress: 0,
        affectedIds: action.payload.affectedIds
      }
    },
    
    updateBulkProgress: (state, action: PayloadAction<number>) => {
      if (state.bulkOperations.isRunning) {
        state.bulkOperations.progress = Math.min(100, Math.max(0, action.payload))
      }
    },
    
    completeBulkOperation: (state) => {
      state.bulkOperations = {
        isRunning: false,
        operation: null,
        progress: 0,
        affectedIds: []
      }
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null
    },
    
    // Manual updates
    updateDocumentInPlace: (state, action: PayloadAction<Partial<EnhancedDocument> & { id: string }>) => {
      const { id, ...updates } = action.payload
      if (state.items[id]) {
        state.items[id] = { ...state.items[id], ...updates }
      }
    }
  },
  
  extraReducers: (builder) => {
    // Load documents
    builder
      .addCase(loadDocuments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loadDocuments.fulfilled, (state, action) => {
        state.isLoading = false
        
        const documents = action.payload
        const normalizedItems: Record<string, EnhancedDocument> = {}
        const ids: string[] = []
        
        documents.forEach((doc: Document) => {
          const enhancedDoc: EnhancedDocument = {
            ...doc,
            lastViewedAt: Date.now(),
            viewCount: 0,
            version: 1
          }
          normalizedItems[doc.id] = enhancedDoc
          ids.push(doc.id)
        })
        
        state.items = normalizedItems
        state.ids = ids
        state.totalSize = documents.reduce((sum: number, doc: Document) => sum + (doc.size || 0), 0)
        state.lastSyncTime = Date.now()
      })
      .addCase(loadDocuments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Save document
    builder
      .addCase(saveDocument.pending, (state, action) => {
        state.isSaving = true
        
        const document = action.meta.arg
        const optimisticDoc: EnhancedDocument = {
          ...document,
          lastViewedAt: Date.now(),
          viewCount: 0,
          version: 1
        }
        
        state.items[document.id] = optimisticDoc
        if (!state.ids.includes(document.id)) {
          state.ids.unshift(document.id)
        }
        
        state.optimisticUpdates[document.id] = {
          type: 'create',
          timestamp: Date.now()
        }
      })
      .addCase(saveDocument.fulfilled, (state, action) => {
        state.isSaving = false
        
        const document = action.payload
        state.items[document.id] = document
        
        delete state.optimisticUpdates[document.id]
        
        state.totalSize = Object.values(state.items).reduce((sum, doc) => sum + (doc.size || 0), 0)
      })
      .addCase(saveDocument.rejected, (state, action) => {
        state.isSaving = false
        state.error = action.payload as string
        
        const documentId = action.meta.arg.id
        const optimisticUpdate = state.optimisticUpdates[documentId]
        
        if (optimisticUpdate) {
          if (optimisticUpdate.type === 'create') {
            delete state.items[documentId]
            state.ids = state.ids.filter(id => id !== documentId)
          } else if (optimisticUpdate.originalData) {
            state.items[documentId] = optimisticUpdate.originalData
          }
          
          delete state.optimisticUpdates[documentId]
        }
      })
    
    // Update status
    builder
      .addCase(updateDocumentStatus.fulfilled, (state, action) => {
        const document = action.payload
        state.items[document.id] = document
      })
      .addCase(updateDocumentStatus.rejected, (state, action) => {
        state.error = action.payload as string
      })
    
    // Delete documents
    builder
      .addCase(deleteDocuments.pending, (state, action) => {
        const idsToDelete = action.meta.arg
        
        idsToDelete.forEach(id => {
          if (state.items[id]) {
            state.optimisticUpdates[id] = {
              type: 'delete',
              timestamp: Date.now(),
              originalData: state.items[id]
            }
            delete state.items[id]
          }
        })
        
        state.ids = state.ids.filter(id => !idsToDelete.includes(id))
        state.selectedIds = state.selectedIds.filter(id => !idsToDelete.includes(id))
      })
      .addCase(deleteDocuments.fulfilled, (state, action) => {
        const deletedIds = action.payload
        
        deletedIds.forEach(id => {
          delete state.optimisticUpdates[id]
        })
        
        state.totalSize = Object.values(state.items).reduce((sum, doc) => sum + (doc.size || 0), 0)
      })
      .addCase(deleteDocuments.rejected, (state, action) => {
        state.error = action.payload as string
        
        const idsToRestore = action.meta.arg
        idsToRestore.forEach(id => {
          const optimisticUpdate = state.optimisticUpdates[id]
          if (optimisticUpdate?.originalData) {
            state.items[id] = optimisticUpdate.originalData
            if (!state.ids.includes(id)) {
              state.ids.push(id)
            }
          }
          delete state.optimisticUpdates[id]
        })
      })
    
    // Search documents
    builder
      .addCase(searchDocuments.fulfilled, (state, action) => {
        const { query, results } = action.payload
        
        if (query === state.searchQuery) {
          results.forEach(doc => {
            if (state.items[doc.id]) {
              state.items[doc.id].searchRelevanceScore = doc.searchRelevanceScore || 1
            }
          })
          
          if (state.sortBy === 'relevance') {
            state.ids = results.map(doc => doc.id)
          }
        }
      })
  }
})

// ================ MEMOIZED SELECTORS ================

/**
 * Get all documents as an array (memoized)
 */
export const selectAllDocuments = createSelector(
  [(state: RootState) => state.documents.items, (state: RootState) => state.documents.ids],
  (items, ids) => ids.map(id => items[id]).filter(Boolean)
)

/**
 * Get filtered and sorted documents (memoized)
 */
export const selectFilteredDocuments = createSelector(
  [selectAllDocuments, (state: RootState) => state.documents.filterCriteria, (state: RootState) => state.documents.searchQuery],
  (documents, filterCriteria, searchQuery) => {
    let filtered = documents
    
    // Apply type filter
    if (filterCriteria.type?.length) {
      filtered = filtered.filter(doc => filterCriteria.type!.includes(doc.type))
    }
    
    // Apply status filter
    if (filterCriteria.status?.length) {
      filtered = filtered.filter(doc => filterCriteria.status!.includes(doc.status))
    }
    
    // Apply date range filter
    if (filterCriteria.dateRange) {
      const { start, end } = filterCriteria.dateRange
      filtered = filtered.filter(doc => {
        const docDate = doc.uploadedAt
        return docDate >= start && docDate <= end
      })
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query) ||
        (doc.metadata.tags && doc.metadata.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      )
    }
    
    return filtered
  }
)

/**
 * Get selected documents (memoized)
 */
export const selectSelectedDocuments = createSelector(
  [(state: RootState) => state.documents.items, (state: RootState) => state.documents.selectedIds],
  (items, selectedIds) => selectedIds.map(id => items[id]).filter(Boolean)
)

/**
 * Get processing statistics (memoized)
 */
export const selectDocumentStats = createSelector(
  [selectAllDocuments],
  (documents) => {
    const stats = {
      total: documents.length,
      ready: 0,
      processing: 0,
      error: 0,
      uploading: 0,
      chunking: 0,
      embedding: 0,
      totalSize: 0,
      averageSize: 0
    }
    
    documents.forEach(doc => {
      if (doc.status in stats) {
        (stats as Record<string, number>)[doc.status] += 1
      }
      stats.totalSize += doc.size || 0
    })
    
    stats.averageSize = stats.total > 0 ? stats.totalSize / stats.total : 0
    
    return stats
  }
)

// Export actions
export const {
  toggleDocumentSelection,
  selectAllDocuments: selectAllDocumentsAction,
  clearSelection,
  setSearchQuery,
  setFilterCriteria,
  clearFilters,
  setViewMode,
  setSorting,
  addOptimisticUpdate,
  removeOptimisticUpdate,
  startBulkOperation,
  updateBulkProgress,
  completeBulkOperation,
  clearError,
  updateDocumentInPlace
} = documentsSlice.actions

export default documentsSlice.reducer
