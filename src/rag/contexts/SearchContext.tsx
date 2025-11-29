"use client"

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { Document, SearchResult } from '../types'
import { generateEmbedding } from '../utils/document-processing'
import { ragStorage } from '../utils/storage'
import { intelligentSearch, EnhancedSearchResult } from '../utils/unified-intelligent-search-engine'
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
  state: SearchState
  searchResults: SearchResult[]
  searchHistory: string[]
  isSearching: boolean
  lastQuery: string
  searchDocuments: (query: string, documents?: Document[]) => Promise<SearchResult[]>
  storeFeedback: (
    queryText: string,
    rating: 'positive' | 'negative',
    score: number,
    sources: SearchResult[],
    categories?: string[],
    comment?: string
  ) => Promise<void>
  getQuerySuggestions: (partialQuery: string, limit?: number) => string[]
  // Performance metrics
  getAnalyticsSummary: () => Promise<Record<string, unknown>>
  clearResults: () => void

  // Legacy compatibility properties for existing RAGContext
  query?: string
  setQuery?: (query: string) => void
  results?: SearchResult[]
  performSearch?: (query: string) => Promise<void>
}

const SearchContext = createContext<SearchContextType | null>(null)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState)

  /**
   * Enhanced search with all 5 critical improvements:
   * 1. Persistent Vector Database
   * 2. Hybrid Search Engine  
   * 3. Intelligent Query Processing
   * 4. Adaptive Feedback Learning
   * 5. Advanced Query Caching
   */
  const searchDocuments = useCallback(async (query: string, providedDocuments?: Document[]): Promise<SearchResult[]> => {
    if (!query.trim()) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] })
      return []
    }

    dispatch({ type: 'SET_SEARCHING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_LAST_QUERY', payload: query })

    try {
      // Load documents from storage if not provided
      let documentsToSearch = providedDocuments || []
      if (!providedDocuments) {
        try {
          const storedDocuments = await ragStorage.loadDocuments()
          documentsToSearch = storedDocuments.filter(doc => doc.status === 'ready' && doc.chunks)
        } catch (error) {
          console.warn('Failed to load documents from storage:', error)
          documentsToSearch = []
        }
      } else {
        documentsToSearch = providedDocuments.filter(doc => doc.status === 'ready' && doc.chunks)
      }
      
      console.log(`🔍 Enhanced RAG Search: Searching through ${documentsToSearch.length} ready documents for query: "${query}"`)
      
      if (documentsToSearch.length === 0) {
        console.log('❌ No ready documents found for search')
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] })
        return []
      }

      // IMPROVEMENT 3: Enhanced Query Processing & Intent Analysis
      const { EnhancedQueryProcessor } = await import('../utils/enhanced-query-processor')
      
      // Analyze query intent and expand with domain-specific context
      const queryIntent = EnhancedQueryProcessor.analyzeQueryIntent(query)
      const expandedQuery = EnhancedQueryProcessor.expandQuery(query, queryIntent)
      
      console.log(`🧠 Query analysis:`, { 
        originalQuery: query, 
        expandedQuery, 
        domain: queryIntent.domain,
        searchScope: queryIntent.searchScope,
        entityTypes: queryIntent.entityTypes
      })
      
      // Generate embeddings for both original and expanded query
      const [queryEmbedding, expandedEmbedding] = await Promise.all([
        generateEmbedding(query),
        generateEmbedding(expandedQuery)
      ])

      // IMPROVEMENT 5: Advanced Semantic Caching & Performance Optimization
      const { createSemanticCacheWrapper } = await import('../utils/semantic-cache-wrapper')
      const semanticCache = await createSemanticCacheWrapper({
        enableSemanticCache: true,
        useLegacyCache: true,
        preferSemanticCache: true
      })
      
      // Check semantic cache first (matches similar queries, not just exact)
      const cachedResults = await semanticCache.get(query, queryEmbedding)
      if (cachedResults && cachedResults.length > 0) {
        console.log(`✨ Semantic Cache HIT: Found ${cachedResults.length} cached results for query: "${query}"`)
        
        // Convert cached results to SearchResult format
        const searchResults: SearchResult[] = []
        for (const cached of cachedResults) {
          // Find the actual document and chunk from storage
          const doc = documentsToSearch.find(d => d.id === cached.id)
          const chunk = doc?.chunks?.find(c => c.id === cached.id)
          
          if (doc && chunk) {
            searchResults.push({
              id: chunk.id,
              content: chunk.content,
              score: cached.score,
              metadata: chunk.metadata as Record<string, unknown>,
              chunk,
              document: doc,
              similarity: cached.score,
              relevantText: cached.content.substring(0, 200) + '...'
            })
          }
        }
        
        // Store results and return
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: searchResults })
        dispatch({ type: 'ADD_TO_HISTORY', payload: query })
        
        console.log(`🎯 Semantic cache-served results: ${searchResults.length} results`)
        return searchResults
      }
      
      console.log(`💨 Cache MISS: Performing full semantic search for query: "${query}"`)

      // IMPROVEMENT 1: Persistent Vector Storage
      const { PersistentVectorStorage } = await import('../utils/persistent-vector-storage')
      const vectorStorage = new PersistentVectorStorage()
      
      // Store all document embeddings in persistent storage (only if not already stored)
      await vectorStorage.storeEmbeddings(documentsToSearch)

      // IMPROVEMENT 2: Hybrid Search Engine Integration
      const { HybridSearchEngine } = await import('../utils/hybrid-search')
      
      // Initialize hybrid search engine for better keyword + semantic matching
      const hybridSearch = new HybridSearchEngine({
        bm25Weight: 0.4,    // Balance keyword and semantic search
        vectorWeight: 0.6,  // Favor semantic similarity slightly
        minimumScore: 0.05, // Lower threshold to catch more results
        maxResults: 20,
        enableReranking: true
      })
      
      // Add documents to hybrid search index
      for (const doc of documentsToSearch) {
        if (doc.chunks) {
          for (const chunk of doc.chunks) {
            hybridSearch.addDocument({
              id: chunk.id,
              content: chunk.content,
              title: doc.name,
              metadata: {
                type: doc.type || 'document',
                keywords: doc.metadata?.tags || doc.aiAnalysis?.keywords || [],
                documentId: doc.id,
                chunkId: chunk.id
              }
            }, chunk.embedding)
          }
        }
      }
      
      // Perform hybrid search with both original and expanded queries
      const [hybridResults, expandedResults] = await Promise.all([
        hybridSearch.search(query, queryEmbedding),
        hybridSearch.search(expandedQuery, expandedEmbedding)
      ])
      
      // Get persistent storage results for fallback
      const persistentResults = await vectorStorage.searchSimilar(
        queryEmbedding,
        {
          limit: 10,
          threshold: 0.1,
          includeMetadata: true
        }
      )
      
      // Merge and deduplicate results from all search methods
      const allResultsMap = new Map<string, SearchResult>()
      
      // Add hybrid search results (prioritized)
      for (const result of hybridResults) {
        const doc = documentsToSearch.find(d => d.id === result.document.metadata.documentId)
        const chunk = doc?.chunks?.find(c => c.id === result.document.id)
        
        if (doc && chunk) {
          allResultsMap.set(chunk.id, {
            id: chunk.id,
            content: chunk.content,
            score: result.scores.combined,
            metadata: chunk.metadata as Record<string, unknown>,
            chunk,
            document: doc,
            similarity: result.scores.combined,
            relevantText: result.document.content.substring(0, 200) + '...'
          })
        }
      }
      
      // Add expanded query results (with slight penalty)
      for (const result of expandedResults) {
        const doc = documentsToSearch.find(d => d.id === result.document.metadata.documentId)
        const chunk = doc?.chunks?.find(c => c.id === result.document.id)
        
        if (doc && chunk && !allResultsMap.has(chunk.id)) {
          allResultsMap.set(chunk.id, {
            id: chunk.id,
            content: chunk.content,
            score: result.scores.combined * 0.9,
            metadata: chunk.metadata as Record<string, unknown>,
            chunk,
            document: doc,
            similarity: result.scores.combined * 0.9, // Slight penalty for expanded query results
            relevantText: result.document.content.substring(0, 200) + '...'
          })
        }
      }
      
      // Add persistent storage results as fallback (if not already present)
      for (const result of persistentResults) {
        if (result.chunk && !allResultsMap.has(result.chunk.id)) {
          allResultsMap.set(result.chunk.id, result)
        }
      }

      // IMPROVEMENT 4: Adaptive Feedback Learning Integration
      const { feedbackLearner } = await import('../utils/adaptive-feedback-learning')
      
      // First apply intent-based re-ranking
      const intentRankedResults = EnhancedQueryProcessor.reRankResults(
        Array.from(allResultsMap.values()),
        query,
        queryIntent
      )
      
      // Then apply adaptive feedback learning to further optimize results
      const searchResults = feedbackLearner.applyLearningToResults(
        query,
        intentRankedResults
      )
      
      // Cache the results in semantic cache for future similar queries
      const cacheResults = searchResults
        .filter(result => result.document && result.chunk && typeof result.similarity === 'number')
        .map(result => ({
          id: result.chunk!.id,
          score: result.similarity!,
          content: result.chunk!.content,
          metadata: {
            documentId: result.document!.id,
            title: result.document!.name,
            type: result.document!.type || 'document',
            keywords: result.document!.metadata?.tags || result.document!.aiAnalysis?.keywords || []
          }
        }))
      
      const documentIds = searchResults
        .filter(result => result.document)
        .map(result => result.document!.id)
      
      await semanticCache.set(
        query, 
        queryEmbedding, 
        cacheResults,
        [...new Set(documentIds)] // Unique document IDs
      )
      
      console.log(`💾 Cached ${cacheResults.length} results in semantic cache`)
      
      console.log(`🎯 Enhanced search complete: ${searchResults.length} results after intent analysis + feedback learning`)
      
      // Store results and add to search history
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: searchResults })
      dispatch({ type: 'ADD_TO_HISTORY', payload: query })
      
      // Log final results summary
      console.log(`🏆 Final search results:`)
      searchResults.slice(0, 5).forEach((result: SearchResult, index: number) => {
        if (result.document && result.chunk && typeof result.similarity === 'number') {
          console.log(`  ${index + 1}. "${result.document.name}" - Score: ${result.similarity.toFixed(3)} - Preview: "${result.chunk.content.substring(0, 100)}..."`)
        }
      })
      
      return searchResults
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      console.error('🚨 Enhanced search error:', errorMessage)
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return []
    } finally {
      dispatch({ type: 'SET_SEARCHING', payload: false })
    }
  }, [])

  const storeFeedback = useCallback(async (
    queryText: string,
    rating: 'positive' | 'negative',
    score: number,
    sources: SearchResult[],
    categories?: string[],
    comment?: string
  ) => {
    // Store feedback in both systems for comprehensive learning
    console.log(`💾 Storing feedback: ${rating} (${score}) for query: "${queryText}"`)
    
    try {
      // Import feedback systems
      const { FeedbackEnhancedSearch } = await import('../utils/feedback-enhanced-search')
      const { feedbackLearner } = await import('../utils/adaptive-feedback-learning')
      
      // Store in the feedback-enhanced search system
      await FeedbackEnhancedSearch.storeFeedback(
        queryText,
        rating,
        score,
        sources,
        categories || [],
        comment || ''
      )
      
      // Store individual result feedback in adaptive learning system
      for (const source of sources) {
        if (source.chunk && source.document && typeof source.similarity === 'number') {
          feedbackLearner.recordFeedback({
            query: queryText,
            resultId: source.chunk.id,
            documentId: source.document.id,
            chunkId: source.chunk.id,
            rating: rating,
            explanation: comment ?? '',
            searchContext: {
              originalScore: source.similarity,
              position: sources.indexOf(source) + 1,
              totalResults: sources.length
            }
          })
        }
      }
      console.log('✅ Feedback stored in both FeedbackEnhancedSearch and AdaptiveFeedbackLearner systems')
    } catch (error) {
      console.error('Failed to store feedback:', error)
    }
  }, [])

  const getQuerySuggestions = useCallback((partialQuery: string, limit: number = 5) => {
    import('../utils/feedback-enhanced-search').then(({ FeedbackEnhancedSearch }) => {
      return FeedbackEnhancedSearch.getQuerySuggestions(partialQuery, limit)
    }).catch(() => [])
    return []
  }, [])

  const getAnalyticsSummary = useCallback(async () => {
    try {
      const { FeedbackEnhancedSearch } = await import('../utils/feedback-enhanced-search')
      return await FeedbackEnhancedSearch.getAnalyticsSummary()
    } catch (error) {
      console.error('Failed to get analytics:', error)
      return {}
    }
  }, [])

  const clearResults = useCallback(() => {
    dispatch({ type: 'CLEAR_RESULTS' })
  }, [])

  const value: SearchContextType = {
    state,
    searchResults: state.searchResults,
    searchHistory: state.searchHistory,
    isSearching: state.isSearching,
    lastQuery: state.lastQuery,
    searchDocuments,
    storeFeedback,
    getQuerySuggestions,
    getAnalyticsSummary,
    clearResults,

    // Legacy compatibility properties for existing RAGContext
    query: state.lastQuery,
    setQuery: (query: string) => dispatch({ type: 'SET_LAST_QUERY', payload: query }),
    results: state.searchResults,
    performSearch: async (query: string) => {
      await searchDocuments(query)
      // The results are already stored in state by searchDocuments
      return
    }
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
