"use client"

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { Document, SearchResult } from '../types'
import { intelligentSearch, recordSearchFeedback, getSearchMetrics } from '../utils/unified-intelligent-search-engine'
import { getSearchConfig } from '@/utils/configuration'

interface SearchState {
  searchResults: SearchResult[]
  isSearching: boolean
  error: string | null
  lastQuery: string
  searchHistory: string[]
}

type SearchAction =
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_LAST_QUERY'; payload: string }
  | { type: 'ADD_TO_HISTORY'; payload: string }
  | { type: 'CLEAR_RESULTS' }

const initialState: SearchState = {
  searchResults: [],
  isSearching: false,
  error: null,
  lastQuery: '',
  searchHistory: []
}

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_SEARCHING':
      return { ...state, isSearching: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isSearching: false }
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload }
    case 'SET_LAST_QUERY':
      return { ...state, lastQuery: action.payload }
    case 'ADD_TO_HISTORY':
      const searchConfig = getSearchConfig()
      const maxHistorySize = searchConfig.defaultLimit * 2
      const newHistory = [action.payload, ...state.searchHistory.filter(q => q !== action.payload)].slice(0, maxHistorySize)
      return { ...state, searchHistory: newHistory }
    case 'CLEAR_RESULTS':
      return { ...state, searchResults: [], lastQuery: '', error: null }
    default:
      return state
  }
}

interface SearchContextType {
  // State
  searchResults: SearchResult[]
  isSearching: boolean
  error: string | null
  lastQuery: string
  searchHistory: string[]
  
  // Core functions
  searchDocuments: (query: string, documents?: Document[]) => Promise<SearchResult[]>
  clearResults: () => void
  
  // Feedback and analytics
  provideFeedback: (resultId: string, rating: number, query: string) => Promise<void>
  getQuerySuggestions: (partialQuery: string, limit?: number) => Promise<string[]>
  getAnalyticsSummary: () => Promise<Record<string, unknown>>
}

const SearchContext = createContext<SearchContextType | null>(null)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState)

  /**
   * 🚀 UNIFIED INTELLIGENT SEARCH IMPLEMENTATION
   * 
   * Uses the production-ready unified-intelligent-search-engine
   * for enhanced search capabilities with proper source tracking
   */
  const searchDocuments = useCallback(async (query: string, documents?: Document[]): Promise<SearchResult[]> => {
    if (!query.trim()) {
      dispatch({ type: 'CLEAR_RESULTS' })
      return []
    }

    dispatch({ type: 'SET_SEARCHING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_LAST_QUERY', payload: query })
    dispatch({ type: 'ADD_TO_HISTORY', payload: query })

    try {
      console.log(`🔍 UnifiedSearchContext: Starting intelligent search for "${query}"`)
      
      // Use the unified intelligent search engine
      const enhancedResults = await intelligentSearch(query, {
        documents: documents || undefined,
        mode: 'balanced',
        limit: getSearchConfig().defaultLimit,
        threshold: 0.2,
        includeExpansion: true,
        enableCaching: true
      })

      // Convert EnhancedSearchResult to SearchResult for backward compatibility
      const searchResults: SearchResult[] = enhancedResults
        .filter(result => result.document && result.chunk) // Ensure required fields exist
        .map(result => ({
          document: result.document!,
          chunk: result.chunk!,
          similarity: result.scores.combined,
          score: result.scores.combined,
          id: result.chunk!.id || '',
          content: result.chunk!.content || '',
          metadata: result.chunk!.metadata as Record<string, unknown> || {},
          relevantText: result.explanation
        }))

      console.log(`✅ UnifiedSearchContext: Found ${searchResults.length} intelligent results`)
      console.log(`🎯 Search results preview:`, searchResults.slice(0, 3).map(r => ({
        documentName: r.document?.name,
        chunkId: r.chunk?.id,
        score: r.similarity,
        hasContent: !!r.chunk?.content
      })))
      
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: searchResults })
      
      return searchResults
    } catch (error) {
      console.error('❌ UnifiedSearchContext: Search failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return []
    } finally {
      dispatch({ type: 'SET_SEARCHING', payload: false })
    }
  }, [])

  const clearResults = useCallback(() => {
    dispatch({ type: 'CLEAR_RESULTS' })
  }, [])

  const provideFeedback = useCallback(async (
    resultId: string, 
    rating: number, 
    query: string
  ): Promise<void> => {
    try {
      // Use the intelligent search engine's feedback system
      await recordSearchFeedback(query, resultId, rating)
      console.log(`📊 UnifiedSearchContext: Recorded feedback ${rating} for result ${resultId}`)
    } catch (error) {
      console.error('❌ Failed to record feedback:', error)
    }
  }, [])

  const getQuerySuggestions = useCallback(async (partialQuery: string, limit = 5): Promise<string[]> => {
    // Use search history as suggestions
    return state.searchHistory
      .filter(q => q.toLowerCase().includes(partialQuery.toLowerCase()))
      .slice(0, limit)
  }, [state.searchHistory])

  const getAnalyticsSummary = useCallback(async (): Promise<Record<string, unknown>> => {
    try {
      const metrics = await getSearchMetrics()
      return {
        ...metrics,
        totalSearches: state.searchHistory.length,
        recentQueries: state.searchHistory.slice(0, 10),
        lastQuery: state.lastQuery,
        hasResults: state.searchResults.length > 0
      }
    } catch (error) {
      console.error('❌ Failed to get analytics:', error)
      return {
        totalSearches: state.searchHistory.length,
        recentQueries: state.searchHistory.slice(0, 10),
        lastQuery: state.lastQuery,
        hasResults: state.searchResults.length > 0
      }
    }
  }, [state.searchHistory, state.lastQuery, state.searchResults.length])

  const value: SearchContextType = {
    // State
    searchResults: state.searchResults,
    isSearching: state.isSearching,
    error: state.error,
    lastQuery: state.lastQuery,
    searchHistory: state.searchHistory,
    
    // Functions
    searchDocuments,
    clearResults,
    provideFeedback,
    getQuerySuggestions,
    getAnalyticsSummary
  }

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

export { SearchContext }
