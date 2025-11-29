import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// Visual Content Types
export interface VisualContentItem {
  id: string
  documentId: string
  type: 'image' | 'chart' | 'table' | 'diagram' | 'screenshot'
  title: string
  description?: string
  source: string // URL or base64 data
  thumbnail?: string
  
  // Content data
  data?: {
    url?: string
    base64?: string
    headers?: string[]
    rows?: string[][]
    elements?: any[]
  }
  
  // Processing metadata
  extractedText?: string
  ocrConfidence?: number
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  processingError?: string
  
  // AI Analysis
  llmSummary?: {
    keyInsights: string[]
    challenges: string[]
    mainContent: string
    significance: string
    technicalDetails?: string[]
  }
  
  // Metadata
  metadata?: {
    width?: number
    height?: number
    format?: string
    fileSize?: number
    createdAt: string
    lastAnalyzed?: string
    confidence?: number
  }
  
  // Tags and categorization
  tags: string[]
  category?: string
  isVisible: boolean
  isFavorite: boolean
}

export interface VisualContentAnalytics {
  totalItems: number
  byType: { [key: string]: number }
  byStatus: { [key: string]: number }
  averageConfidence: number
  recentlyAdded: number // last 24h
  topCategories: { category: string; count: number }[]
}

export interface VisualContentFilters {
  types: string[]
  statuses: string[]
  tags: string[]
  categories: string[]
  documentIds: string[]
  dateRange: { start: string | null; end: string | null }
  minConfidence: number
  showFavoritesOnly: boolean
  showVisibleOnly: boolean
}

export interface VisualContentState {
  // Content management
  items: VisualContentItem[]
  loading: boolean
  error: string | null
  
  // Selection and interaction
  selectedItemIds: string[]
  previewItemId: string | null
  
  // Filtering and sorting
  filters: VisualContentFilters
  searchQuery: string
  sortBy: 'date' | 'name' | 'type' | 'confidence' | 'size'
  sortOrder: 'asc' | 'desc'
  
  // View options
  viewMode: 'grid' | 'list' | 'masonry'
  gridSize: 'small' | 'medium' | 'large'
  showDetails: boolean
  
  // Processing status
  processingQueue: string[] // Item IDs being processed
  batchOperationProgress: { [operationId: string]: number }
  
  // Analytics
  analytics: VisualContentAnalytics
  
  // Cache and performance
  thumbnailCache: { [itemId: string]: string }
  lazyLoadOffset: number
}

const initialState: VisualContentState = {
  // Content management
  items: [],
  loading: false,
  error: null,
  
  // Selection and interaction
  selectedItemIds: [],
  previewItemId: null,
  
  // Filtering and sorting
  filters: {
    types: [],
    statuses: [],
    tags: [],
    categories: [],
    documentIds: [],
    dateRange: { start: null, end: null },
    minConfidence: 0,
    showFavoritesOnly: false,
    showVisibleOnly: true
  },
  searchQuery: '',
  sortBy: 'date',
  sortOrder: 'desc',
  
  // View options
  viewMode: 'grid',
  gridSize: 'medium',
  showDetails: false,
  
  // Processing status
  processingQueue: [],
  batchOperationProgress: {},
  
  // Analytics
  analytics: {
    totalItems: 0,
    byType: {},
    byStatus: {},
    averageConfidence: 0,
    recentlyAdded: 0,
    topCategories: []
  },
  
  // Cache and performance
  thumbnailCache: {},
  lazyLoadOffset: 0
}

// Async thunks
export const processVisualContent = createAsyncThunk(
  'visualContent/process',
  async (itemId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { visualContent: VisualContentState }
      const item = state.visualContent.items.find(item => item.id === itemId)
      
      if (!item) {
        throw new Error('Visual content item not found')
      }
      
      // Add to processing queue
      dispatch(addToProcessingQueue(itemId))
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock AI analysis results
      const mockAnalysis = {
        keyInsights: [
          `Visual content type: ${item.type}`,
          'Contains structured information',
          'High quality visual representation'
        ],
        challenges: [
          'OCR processing may have limitations',
          'Complex layouts require careful analysis'
        ],
        mainContent: `This ${item.type} contains important visual information that has been processed and analyzed.`,
        significance: 'Provides visual context and enhances document understanding.',
        technicalDetails: [
          `Format: ${item.metadata?.format || 'Unknown'}`,
          `Resolution: ${item.metadata?.width}x${item.metadata?.height}`,
          `File size: ${item.metadata?.fileSize || 0} bytes`
        ]
      }
      
      const processedItem = {
        ...item,
        processingStatus: 'completed' as const,
        llmSummary: mockAnalysis,
        ocrConfidence: 0.85 + Math.random() * 0.15, // Mock confidence score
        metadata: {
          ...item.metadata,
          lastAnalyzed: new Date().toISOString(),
          confidence: 0.85 + Math.random() * 0.15
        }
      }
      
      // Remove from processing queue
      dispatch(removeFromProcessingQueue(itemId))
      
      return processedItem
    } catch (error) {
      dispatch(removeFromProcessingQueue(itemId))
      return rejectWithValue(`Processing failed: ${error}`)
    }
  }
)

export const batchProcessVisualContent = createAsyncThunk(
  'visualContent/batchProcess',
  async (itemIds: string[], { dispatch, rejectWithValue }) => {
    try {
      const operationId = `batch_${Date.now()}`
      const results = []
      
      for (let i = 0; i < itemIds.length; i++) {
        const itemId = itemIds[i]
        const progress = Math.round(((i + 1) / itemIds.length) * 100)
        
        // Update progress
        dispatch(updateBatchOperationProgress({ operationId, progress }))
        
        // Process item
        const result = await dispatch(processVisualContent(itemId)).unwrap()
        results.push(result)
      }
      
      // Clear progress
      dispatch(clearBatchOperationProgress(operationId))
      
      return results
    } catch (error) {
      return rejectWithValue(`Batch processing failed: ${error}`)
    }
  }
)

// Visual Content slice
const visualContentSlice = createSlice({
  name: 'visualContent',
  initialState,
  reducers: {
    // Content management
    addVisualContent: (state, action: PayloadAction<VisualContentItem>) => {
      const existingIndex = state.items.findIndex(item => item.id === action.payload.id)
      if (existingIndex !== -1) {
        state.items[existingIndex] = action.payload
      } else {
        state.items.push(action.payload)
      }
      // Update analytics
      state.analytics.totalItems = state.items.length
    },
    
    updateVisualContent: (state, action: PayloadAction<Partial<VisualContentItem> & { id: string }>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload }
      }
    },
    
    removeVisualContent: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
      state.selectedItemIds = state.selectedItemIds.filter(id => id !== action.payload)
      if (state.previewItemId === action.payload) {
        state.previewItemId = null
      }
      delete state.thumbnailCache[action.payload]
      state.analytics.totalItems = state.items.length
    },
    
    // Selection management
    selectVisualContent: (state, action: PayloadAction<string[]>) => {
      state.selectedItemIds = action.payload
    },
    
    toggleSelectVisualContent: (state, action: PayloadAction<string>) => {
      const itemId = action.payload
      const index = state.selectedItemIds.indexOf(itemId)
      if (index !== -1) {
        state.selectedItemIds.splice(index, 1)
      } else {
        state.selectedItemIds.push(itemId)
      }
    },
    
    selectAllVisualContent: (state) => {
      state.selectedItemIds = state.items
        .filter(item => !state.filters.showVisibleOnly || item.isVisible)
        .map(item => item.id)
    },
    
    clearSelection: (state) => {
      state.selectedItemIds = []
    },
    
    // Preview management
    setPreviewItem: (state, action: PayloadAction<string | null>) => {
      state.previewItemId = action.payload
    },
    
    // Filtering and sorting
    setFilters: (state, action: PayloadAction<Partial<VisualContentFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    
    setSorting: (state, action: PayloadAction<{ 
      sortBy: VisualContentState['sortBy']
      sortOrder: VisualContentState['sortOrder'] 
    }>) => {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
    },
    
    // View options
    setViewMode: (state, action: PayloadAction<VisualContentState['viewMode']>) => {
      state.viewMode = action.payload
    },
    
    setGridSize: (state, action: PayloadAction<VisualContentState['gridSize']>) => {
      state.gridSize = action.payload
    },
    
    toggleShowDetails: (state) => {
      state.showDetails = !state.showDetails
    },
    
    // Item actions
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => item.id === action.payload)
      if (item) {
        item.isFavorite = !item.isFavorite
      }
    },
    
    toggleVisibility: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => item.id === action.payload)
      if (item) {
        item.isVisible = !item.isVisible
      }
    },
    
    updateTags: (state, action: PayloadAction<{ itemId: string; tags: string[] }>) => {
      const item = state.items.find(item => item.id === action.payload.itemId)
      if (item) {
        item.tags = action.payload.tags
      }
    },
    
    // Processing queue management
    addToProcessingQueue: (state, action: PayloadAction<string>) => {
      if (!state.processingQueue.includes(action.payload)) {
        state.processingQueue.push(action.payload)
      }
    },
    
    removeFromProcessingQueue: (state, action: PayloadAction<string>) => {
      state.processingQueue = state.processingQueue.filter(id => id !== action.payload)
    },
    
    clearProcessingQueue: (state) => {
      state.processingQueue = []
    },
    
    // Batch operations
    updateBatchOperationProgress: (state, action: PayloadAction<{ operationId: string; progress: number }>) => {
      state.batchOperationProgress[action.payload.operationId] = action.payload.progress
    },
    
    clearBatchOperationProgress: (state, action: PayloadAction<string>) => {
      delete state.batchOperationProgress[action.payload]
    },
    
    // Cache management
    updateThumbnailCache: (state, action: PayloadAction<{ itemId: string; thumbnail: string }>) => {
      state.thumbnailCache[action.payload.itemId] = action.payload.thumbnail
    },
    
    clearThumbnailCache: (state) => {
      state.thumbnailCache = {}
    },
    
    // Analytics
    updateAnalytics: (state) => {
      const items = state.items
      
      // Calculate analytics
      const byType: { [key: string]: number } = {}
      const byStatus: { [key: string]: number } = {}
      let totalConfidence = 0
      let confidenceCount = 0
      
      items.forEach(item => {
        // Count by type
        byType[item.type] = (byType[item.type] || 0) + 1
        
        // Count by status
        byStatus[item.processingStatus] = (byStatus[item.processingStatus] || 0) + 1
        
        // Calculate confidence
        if (item.metadata?.confidence) {
          totalConfidence += item.metadata.confidence
          confidenceCount++
        }
      })
      
      // Recent items (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const recentlyAdded = items.filter(item => 
        item.metadata?.createdAt && item.metadata.createdAt > oneDayAgo
      ).length
      
      state.analytics = {
        totalItems: items.length,
        byType,
        byStatus,
        averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
        recentlyAdded,
        topCategories: [] // Could be calculated if categories are used
      }
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Process visual content
      .addCase(processVisualContent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(processVisualContent.fulfilled, (state, action) => {
        state.loading = false
        const index = state.items.findIndex(item => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(processVisualContent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      
      // Batch process
      .addCase(batchProcessVisualContent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(batchProcessVisualContent.fulfilled, (state, action) => {
        state.loading = false
        action.payload.forEach(processedItem => {
          const index = state.items.findIndex(item => item.id === processedItem.id)
          if (index !== -1) {
            state.items[index] = processedItem
          }
        })
      })
      .addCase(batchProcessVisualContent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

// Export actions
export const {
  addVisualContent,
  updateVisualContent,
  removeVisualContent,
  selectVisualContent,
  toggleSelectVisualContent,
  selectAllVisualContent,
  clearSelection,
  setPreviewItem,
  setFilters,
  clearFilters,
  setSearchQuery,
  setSorting,
  setViewMode,
  setGridSize,
  toggleShowDetails,
  toggleFavorite,
  toggleVisibility,
  updateTags,
  addToProcessingQueue,
  removeFromProcessingQueue,
  clearProcessingQueue,
  updateBatchOperationProgress,
  clearBatchOperationProgress,
  updateThumbnailCache,
  clearThumbnailCache,
  updateAnalytics,
  setError,
  clearError
} = visualContentSlice.actions

// Selectors
export const selectAllVisualContentItems = (state: { visualContent: VisualContentState }) => state.visualContent.items
export const selectVisualContentById = (state: { visualContent: VisualContentState }, id: string) => 
  state.visualContent.items.find(item => item.id === id)
export const selectSelectedVisualContent = (state: { visualContent: VisualContentState }) => 
  state.visualContent.items.filter(item => state.visualContent.selectedItemIds.includes(item.id))
export const selectVisualContentLoading = (state: { visualContent: VisualContentState }) => state.visualContent.loading
export const selectVisualContentError = (state: { visualContent: VisualContentState }) => state.visualContent.error
export const selectVisualContentFilters = (state: { visualContent: VisualContentState }) => state.visualContent.filters
export const selectVisualContentAnalytics = (state: { visualContent: VisualContentState }) => state.visualContent.analytics
export const selectProcessingQueue = (state: { visualContent: VisualContentState }) => state.visualContent.processingQueue
export const selectBatchOperationProgress = (state: { visualContent: VisualContentState }) => state.visualContent.batchOperationProgress

// Export reducer
export default visualContentSlice.reducer
