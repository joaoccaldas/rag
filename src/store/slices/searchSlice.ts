import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// Search Types
export interface SearchQuery {
  id: string
  query: string
  timestamp: string
  resultsCount: number
  executionTime: number
  filters?: SearchFilters
}

export interface SearchFilters {
  documentTypes: string[]
  dateRange: { start: string | null; end: string | null }
  authors: string[]
  tags: string[]
  sentiment: string[]
  complexity: string[]
  minConfidence: number
}

export interface SearchResult {
  id: string
  documentId: string
  documentName: string
  documentType: string
  relevanceScore: number
  matchedText: string
  context: string
  highlights: string[]
  metadata: {
    pageNumber?: number
    section?: string
    keywords: string[]
    sentiment: string
  }
}

export interface SearchSuggestion {
  text: string
  type: 'recent' | 'popular' | 'autocomplete'
  frequency?: number
}

export interface SearchState {
  // Current search
  currentQuery: string
  isSearching: boolean
  results: SearchResult[]
  totalResults: number
  searchTime: number
  
  // Search history and suggestions
  recentQueries: SearchQuery[]
  suggestions: SearchSuggestion[]
  popularQueries: string[]
  
  // Filters and sorting
  filters: SearchFilters
  sortBy: 'relevance' | 'date' | 'name' | 'type'
  sortOrder: 'asc' | 'desc'
  
  // Pagination
  currentPage: number
  resultsPerPage: number
  
  // Advanced search options
  searchMode: 'simple' | 'advanced' | 'semantic'
  semanticThreshold: number
  includeVisualContent: boolean
  includeMetadata: boolean
  
  // Search analytics
  analytics: {
    totalSearches: number
    averageResultsPerSearch: number
    mostSearchedTerms: { term: string; count: number }[]
    searchSuccessRate: number
  }
  
  // Error handling
  error: string | null
  lastSearchFailed: boolean
}

const initialState: SearchState = {
  // Current search
  currentQuery: '',
  isSearching: false,
  results: [],
  totalResults: 0,
  searchTime: 0,
  
  // Search history and suggestions
  recentQueries: [],
  suggestions: [],
  popularQueries: [],
  
  // Filters and sorting
  filters: {
    documentTypes: [],
    dateRange: { start: null, end: null },
    authors: [],
    tags: [],
    sentiment: [],
    complexity: [],
    minConfidence: 0.5
  },
  sortBy: 'relevance',
  sortOrder: 'desc',
  
  // Pagination
  currentPage: 1,
  resultsPerPage: 20,
  
  // Advanced search options
  searchMode: 'simple',
  semanticThreshold: 0.7,
  includeVisualContent: true,
  includeMetadata: true,
  
  // Search analytics
  analytics: {
    totalSearches: 0,
    averageResultsPerSearch: 0,
    mostSearchedTerms: [],
    searchSuccessRate: 0
  },
  
  // Error handling
  error: null,
  lastSearchFailed: false
}

// Async thunks
export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (searchParams: {
    query: string
    filters?: Partial<SearchFilters>
    page?: number
  }, { getState, rejectWithValue }) => {
    try {
      const startTime = Date.now()
      const { query, filters = {}, page = 1 } = searchParams
      
      // Get current state for context
      const state = getState() as { search: SearchState; documents: any }
      const documents = state.documents?.items || []
      
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Simple text search implementation
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
      const results: SearchResult[] = []
      
      documents.forEach((doc: any) => {
        if (!doc.extractedText && !doc.content) return
        
        const searchableText = `${doc.name} ${doc.extractedText || doc.content || ''}`.toLowerCase()
        const matchScore = searchTerms.reduce((score, term) => {
          const matches = (searchableText.match(new RegExp(term, 'g')) || []).length
          return score + matches
        }, 0)
        
        if (matchScore > 0) {
          // Find context around matches
          const context = extractContext(searchableText, searchTerms[0])
          const highlights = searchTerms.filter(term => searchableText.includes(term))
          
          results.push({
            id: `result_${doc.id}_${Date.now()}`,
            documentId: doc.id,
            documentName: doc.name,
            documentType: doc.type,
            relevanceScore: matchScore / searchTerms.length,
            matchedText: query,
            context,
            highlights,
            metadata: {
              keywords: doc.aiAnalysis?.keywords || [],
              sentiment: doc.aiAnalysis?.sentiment || 'neutral'
            }
          })
        }
      })
      
      // Sort by relevance
      results.sort((a, b) => b.relevanceScore - a.relevanceScore)
      
      const endTime = Date.now()
      const searchTime = endTime - startTime
      
      return {
        results,
        totalResults: results.length,
        searchTime,
        query,
        page
      }
    } catch (error) {
      return rejectWithValue(`Search failed: ${error}`)
    }
  }
)

// Helper function to extract context
function extractContext(text: string, term: string, contextLength: number = 100): string {
  const index = text.indexOf(term)
  if (index === -1) return text.substring(0, contextLength)
  
  const start = Math.max(0, index - contextLength / 2)
  const end = Math.min(text.length, index + term.length + contextLength / 2)
  
  return text.substring(start, end)
}

export const generateSuggestions = createAsyncThunk(
  'search/generateSuggestions',
  async (partialQuery: string, { getState }) => {
    const state = getState() as { search: SearchState; documents: any }
    const documents = state.documents?.items || []
    const recentQueries = state.search.recentQueries
    
    const suggestions: SearchSuggestion[] = []
    
    // Add recent query suggestions
    recentQueries
      .filter(q => q.query.toLowerCase().includes(partialQuery.toLowerCase()))
      .slice(0, 3)
      .forEach(q => {
        suggestions.push({
          text: q.query,
          type: 'recent'
        })
      })
    
    // Add autocomplete suggestions from document content
    const keywords = new Set<string>()
    documents.forEach((doc: any) => {
      if (doc.aiAnalysis?.keywords) {
        doc.aiAnalysis.keywords.forEach((keyword: string) => {
          if (keyword.toLowerCase().includes(partialQuery.toLowerCase())) {
            keywords.add(keyword)
          }
        })
      }
    })
    
    Array.from(keywords).slice(0, 5).forEach(keyword => {
      suggestions.push({
        text: keyword,
        type: 'autocomplete'
      })
    })
    
    return suggestions
  }
)

// Search slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Query management
    setQuery: (state, action: PayloadAction<string>) => {
      state.currentQuery = action.payload
    },
    
    clearQuery: (state) => {
      state.currentQuery = ''
      state.results = []
      state.totalResults = 0
    },
    
    // Filter management
    setFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // Sorting
    setSorting: (state, action: PayloadAction<{ sortBy: SearchState['sortBy']; sortOrder: SearchState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
      
      // Re-sort current results
      state.results.sort((a, b) => {
        let aValue: any, bValue: any
        
        switch (action.payload.sortBy) {
          case 'relevance':
            aValue = a.relevanceScore
            bValue = b.relevanceScore
            break
          case 'date':
            aValue = a.documentName // Simplified - should use document date
            bValue = b.documentName
            break
          case 'name':
            aValue = a.documentName
            bValue = b.documentName
            break
          case 'type':
            aValue = a.documentType
            bValue = b.documentType
            break
          default:
            return 0
        }
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return action.payload.sortOrder === 'asc' ? comparison : -comparison
      })
    },
    
    // Pagination
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    
    setResultsPerPage: (state, action: PayloadAction<number>) => {
      state.resultsPerPage = action.payload
      state.currentPage = 1 // Reset to first page
    },
    
    // Search mode and options
    setSearchMode: (state, action: PayloadAction<SearchState['searchMode']>) => {
      state.searchMode = action.payload
    },
    
    setSemanticThreshold: (state, action: PayloadAction<number>) => {
      state.semanticThreshold = Math.max(0, Math.min(1, action.payload))
    },
    
    setSearchOptions: (state, action: PayloadAction<{
      includeVisualContent?: boolean
      includeMetadata?: boolean
    }>) => {
      if (action.payload.includeVisualContent !== undefined) {
        state.includeVisualContent = action.payload.includeVisualContent
      }
      if (action.payload.includeMetadata !== undefined) {
        state.includeMetadata = action.payload.includeMetadata
      }
    },
    
    // Search history
    addToRecentQueries: (state, action: PayloadAction<SearchQuery>) => {
      // Remove duplicate if exists
      state.recentQueries = state.recentQueries.filter(q => q.query !== action.payload.query)
      // Add to beginning
      state.recentQueries.unshift(action.payload)
      // Keep only last 20
      state.recentQueries = state.recentQueries.slice(0, 20)
    },
    
    clearRecentQueries: (state) => {
      state.recentQueries = []
    },
    
    // Suggestions
    setSuggestions: (state, action: PayloadAction<SearchSuggestion[]>) => {
      state.suggestions = action.payload
    },
    
    clearSuggestions: (state) => {
      state.suggestions = []
    },
    
    // Analytics
    updateAnalytics: (state, action: PayloadAction<Partial<SearchState['analytics']>>) => {
      state.analytics = { ...state.analytics, ...action.payload }
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
      // Perform search
      .addCase(performSearch.pending, (state) => {
        state.isSearching = true
        state.error = null
        state.lastSearchFailed = false
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.isSearching = false
        state.results = action.payload.results
        state.totalResults = action.payload.totalResults
        state.searchTime = action.payload.searchTime
        state.currentPage = action.payload.page
        
        // Update analytics
        state.analytics.totalSearches += 1
        state.analytics.averageResultsPerSearch = 
          (state.analytics.averageResultsPerSearch * (state.analytics.totalSearches - 1) + action.payload.totalResults) / 
          state.analytics.totalSearches
        
        // Add to recent queries
        const searchQuery: SearchQuery = {
          id: `search_${Date.now()}`,
          query: action.payload.query,
          timestamp: new Date().toISOString(),
          resultsCount: action.payload.totalResults,
          executionTime: action.payload.searchTime
        }
        
        // Remove duplicate if exists
        state.recentQueries = state.recentQueries.filter(q => q.query !== searchQuery.query)
        // Add to beginning
        state.recentQueries.unshift(searchQuery)
        // Keep only last 20
        state.recentQueries = state.recentQueries.slice(0, 20)
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.isSearching = false
        state.error = action.payload as string
        state.lastSearchFailed = true
      })
      
      // Generate suggestions
      .addCase(generateSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload
      })
  }
})

// Export actions
export const {
  setQuery,
  clearQuery,
  setFilters,
  clearFilters,
  setSorting,
  setPage,
  setResultsPerPage,
  setSearchMode,
  setSemanticThreshold,
  setSearchOptions,
  addToRecentQueries,
  clearRecentQueries,
  setSuggestions,
  clearSuggestions,
  updateAnalytics,
  setError,
  clearError
} = searchSlice.actions

// Selectors
export const selectCurrentQuery = (state: { search: SearchState }) => state.search.currentQuery
export const selectSearchResults = (state: { search: SearchState }) => state.search.results
export const selectSearchLoading = (state: { search: SearchState }) => state.search.isSearching
export const selectSearchError = (state: { search: SearchState }) => state.search.error
export const selectSearchFilters = (state: { search: SearchState }) => state.search.filters
export const selectSearchSorting = (state: { search: SearchState }) => ({
  sortBy: state.search.sortBy,
  sortOrder: state.search.sortOrder
})
export const selectSearchPagination = (state: { search: SearchState }) => ({
  currentPage: state.search.currentPage,
  resultsPerPage: state.search.resultsPerPage,
  totalResults: state.search.totalResults
})
export const selectRecentQueries = (state: { search: SearchState }) => state.search.recentQueries
export const selectSearchSuggestions = (state: { search: SearchState }) => state.search.suggestions
export const selectSearchAnalytics = (state: { search: SearchState }) => state.search.analytics

// Export reducer
export default searchSlice.reducer
