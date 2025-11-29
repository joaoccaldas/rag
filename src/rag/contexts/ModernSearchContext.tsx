/**
 * 🚀 MODERNIZED SEARCH CONTEXT
 * 
 * Updated to use the new Unified Intelligent Search Engine
 * - Eliminates complexity from multiple overlapping search methods
 * - Provides clean, type-safe search API
 * - Intelligent contextual and semantic search
 * - Perfect exact word matching
 */

"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useRAG } from './RAGContext'
import { intelligentSearch, recordSearchFeedback, getSearchMetrics, EnhancedSearchResult } from '../utils/unified-intelligent-search-engine'
import { Document } from '../types'

// ==================== INTERFACES ====================

export interface SearchState {
  // Core search state
  query: string
  results: EnhancedSearchResult[]
  isSearching: boolean
  hasSearched: boolean
  
  // Enhanced features
  suggestions: string[]
  selectedMode: 'balanced' | 'semantic' | 'lexical' | 'precise' | 'exploratory'
  filters: SearchFilters
  
  // Performance metrics
  searchTime: number
  totalResults: number
  
  // Error handling
  error: string | null
}

export interface SearchFilters {
  documentTypes: string[]
  dateRange: { start: Date | null; end: Date | null }
  domains: string[]
  minConfidence: number
}

export interface SearchContextType {
  // State
  searchState: SearchState
  
  // Core search functions
  search: (query: string, options?: SearchOptions) => Promise<EnhancedSearchResult[]>
  clearSearch: () => void
  
  // Advanced features
  setSearchMode: (mode: SearchState['selectedMode']) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  recordFeedback: (resultId: string, rating: number) => Promise<void>
  
  // Suggestions and history
  getSuggestions: (partialQuery: string) => Promise<string[]>
  searchHistory: string[]
  
  // Metrics
  getPerformanceMetrics: () => Record<string, unknown>
}

export interface SearchOptions {
  mode?: SearchState['selectedMode']
  limit?: number
  threshold?: number
  documents?: Document[]
  enableCaching?: boolean
}

// ==================== CONTEXT CREATION ====================

const SearchContext = createContext<SearchContextType | null>(null)

// ==================== SEARCH PROVIDER ====================

export function SearchProvider({ children }: { children: React.ReactNode }) {
  // Core state
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    isSearching: false,
    hasSearched: false,
    suggestions: [],
    selectedMode: 'balanced',
    filters: {
      documentTypes: [],
      dateRange: { start: null, end: null },
      domains: [],
      minConfidence: 0.2
    },
    searchTime: 0,
    totalResults: 0,
    error: null
  })

  // Dependencies
  const { documents } = useRAG()
  const searchHistory = useRef<string[]>([])
  const abortController = useRef<AbortController | null>(null)

  // ==================== CORE SEARCH FUNCTION ====================

  const search = useCallback(async (
    query: string, 
    options: SearchOptions = {}
  ): Promise<EnhancedSearchResult[]> => {
    // Cancel any ongoing search
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()

    const startTime = Date.now()
    const trimmedQuery = query.trim()

    // Early validation
    if (!trimmedQuery) {
      setSearchState(prev => ({
        ...prev,
        query: '',
        results: [],
        isSearching: false,
        hasSearched: false,
        error: null
      }))
      return []
    }

    // Start search
    setSearchState(prev => ({
      ...prev,
      query: trimmedQuery,
      isSearching: true,
      hasSearched: false,
      error: null
    }))

    try {
      console.log(`🔍 ModernSearchContext: Starting search for "${trimmedQuery}"`)

      // Execute intelligent search
      const searchResults = await intelligentSearch(trimmedQuery, {
        mode: options.mode || searchState.selectedMode,
        limit: options.limit || 20,
        threshold: options.threshold || searchState.filters.minConfidence,
        documents: options.documents || documents,
        enableCaching: options.enableCaching !== false,
        ...(searchState.filters.documentTypes.length > 0 && {
          documentTypes: searchState.filters.documentTypes
        }),
        ...(searchState.filters.domains.length > 0 && {
          domainHints: searchState.filters.domains
        })
      })

      const searchTime = Date.now() - startTime

      // Filter by date range if specified
      const filteredResults = searchState.filters.dateRange.start || searchState.filters.dateRange.end ?
        searchResults.filter(result => {
          if (!result.document) return true
          const docDate = new Date(result.document.uploadedAt)
          const { start, end } = searchState.filters.dateRange
          
          if (start && docDate < start) return false
          if (end && docDate > end) return false
          return true
        }) : searchResults

      // Update search history
      if (!searchHistory.current.includes(trimmedQuery)) {
        searchHistory.current.unshift(trimmedQuery)
        searchHistory.current = searchHistory.current.slice(0, 10) // Keep last 10
      }

      // Update state with results
      setSearchState(prev => ({
        ...prev,
        results: filteredResults,
        isSearching: false,
        hasSearched: true,
        searchTime,
        totalResults: filteredResults.length,
        error: null
      }))

      console.log(`✅ Search completed: ${filteredResults.length} results in ${searchTime}ms`)
      return filteredResults

    } catch (error: unknown) {
      const searchTime = Date.now() - startTime
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🚫 Search aborted')
        return []
      }

      console.error('❌ Search error:', error)
      
      setSearchState(prev => ({
        ...prev,
        results: [],
        isSearching: false,
        hasSearched: true,
        searchTime,
        totalResults: 0,
        error: error instanceof Error ? error.message : 'Search failed. Please try again.'
      }))

      return []
    }
  }, [documents, searchState.selectedMode, searchState.filters])

  // ==================== UTILITY FUNCTIONS ====================

  const clearSearch = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
    }

    setSearchState(prev => ({
      ...prev,
      query: '',
      results: [],
      isSearching: false,
      hasSearched: false,
      error: null,
      searchTime: 0,
      totalResults: 0
    }))
  }, [])

  const setSearchMode = useCallback((mode: SearchState['selectedMode']) => {
    setSearchState(prev => ({ ...prev, selectedMode: mode }))
  }, [])

  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setSearchState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }))
  }, [])

  const recordFeedback = useCallback(async (resultId: string, rating: number) => {
    try {
      const result = searchState.results.find(r => r.id === resultId)
      if (result && result.document) {
        await recordSearchFeedback(searchState.query, result.document.id, rating)
        console.log(`📝 Feedback recorded: ${rating} for result ${resultId}`)
      }
    } catch (error) {
      console.error('Failed to record feedback:', error)
    }
  }, [searchState.query, searchState.results])

  const getSuggestions = useCallback(async (partialQuery: string): Promise<string[]> => {
    if (!partialQuery.trim()) return []

    // Simple suggestions based on search history and common terms
    const suggestions: string[] = []
    
    // Add from search history
    const historySuggestions = searchHistory.current
      .filter(q => q.toLowerCase().includes(partialQuery.toLowerCase()))
      .slice(0, 3)
    suggestions.push(...historySuggestions)

    // Add common domain-specific suggestions
    const domainSuggestions = [
      'revenue analysis', 'market strategy', 'financial report',
      'employee training', 'customer feedback', 'technical implementation',
      'process improvement', 'cost reduction', 'sales performance'
    ].filter(s => s.toLowerCase().includes(partialQuery.toLowerCase()))
      .slice(0, 3)
    suggestions.push(...domainSuggestions)

    return [...new Set(suggestions)].slice(0, 6)
  }, [])

  const getPerformanceMetrics = useCallback(() => {
    return {
      ...getSearchMetrics(),
      lastSearchTime: searchState.searchTime,
      totalResultsLastSearch: searchState.totalResults,
      searchHistoryCount: searchHistory.current.length,
      currentMode: searchState.selectedMode
    }
  }, [searchState])

  // ==================== AUTO-SUGGESTIONS ====================

  useEffect(() => {
    if (searchState.query.length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const suggestions = await getSuggestions(searchState.query)
          setSearchState(prev => ({ ...prev, suggestions }))
        } catch (error) {
          console.warn('Failed to get suggestions:', error)
        }
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setSearchState(prev => ({ ...prev, suggestions: [] }))
      return undefined
    }
  }, [searchState.query, getSuggestions])

  // ==================== CLEANUP ====================

  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

  // ==================== CONTEXT VALUE ====================

  const contextValue: SearchContextType = {
    searchState,
    search,
    clearSearch,
    setSearchMode,
    setFilters,
    recordFeedback,
    getSuggestions,
    searchHistory: searchHistory.current,
    getPerformanceMetrics
  }

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  )
}

// ==================== HOOK ====================

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

// ==================== BACKWARD COMPATIBILITY ====================

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useSearch() instead
 */
export function useEnhancedSearch() {
  console.warn('useEnhancedSearch is deprecated. Use useSearch() instead.')
  return useSearch()
}

// ==================== EXPORTS ====================

export { SearchContext }

// Re-export types for convenience
export type { EnhancedSearchResult } from '../utils/unified-intelligent-search-engine'
