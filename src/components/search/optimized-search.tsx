/**
 * Optimized Search System
 * 
 * This module provides enhanced search functionality with:
 * - Debounced search input for performance
 * - Intelligent search indexing
 * - Result caching and memoization
 * - Relevance scoring algorithms
 * - Search analytics and suggestions
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { 
  performSearch, 
  generateSuggestions,
  setQuery,
  setFilters,
  setSorting,
  selectCurrentQuery,
  selectSearchResults,
  selectSearchLoading,
  selectSearchError,
  selectSearchSuggestions,
  selectRecentQueries
} from '../store/slices/searchSlice'
import { 
  useDebounce, 
  usePerformanceMonitor,
  useStableCallback,
  useExpensiveMemo
} from '../utils/performance'
import { Button, Card, LoadingSkeleton } from './ui/modular-components'
import { Search, Filter, Clock, TrendingUp, X } from 'lucide-react'
import type { SearchResult, SearchFilters } from '../types/enhanced-types'

// Search indexing utilities
export class SearchIndexer {
  private static index: Map<string, Set<string>> = new Map()
  private static reverseIndex: Map<string, string[]> = new Map()
  private static termFrequency: Map<string, Map<string, number>> = new Map()

  /**
   * Build search index from documents
   */
  static buildIndex(documents: any[]): void {
    this.index.clear()
    this.reverseIndex.clear()
    this.termFrequency.clear()

    documents.forEach(doc => {
      const text = this.normalizeText(`${doc.name} ${doc.content} ${doc.extractedText || ''}`)
      const terms = this.tokenize(text)
      const uniqueTerms = new Set(terms)

      // Build forward index
      this.index.set(doc.id, uniqueTerms)

      // Build reverse index and calculate term frequency
      uniqueTerms.forEach(term => {
        if (!this.reverseIndex.has(term)) {
          this.reverseIndex.set(term, [])
        }
        this.reverseIndex.get(term)!.push(doc.id)

        if (!this.termFrequency.has(doc.id)) {
          this.termFrequency.set(doc.id, new Map())
        }
        
        const termCount = terms.filter(t => t === term).length
        this.termFrequency.get(doc.id)!.set(term, termCount)
      })
    })
  }

  /**
   * Search documents using the index
   */
  static search(query: string, documents: any[]): SearchResult[] {
    const queryTerms = this.tokenize(this.normalizeText(query))
    const scores = new Map<string, number>()

    queryTerms.forEach(term => {
      const documentIds = this.reverseIndex.get(term) || []
      
      documentIds.forEach(docId => {
        const tf = this.termFrequency.get(docId)?.get(term) || 0
        const idf = Math.log(documents.length / (documentIds.length || 1))
        const score = tf * idf

        scores.set(docId, (scores.get(docId) || 0) + score)
      })
    })

    // Convert scores to search results
    const results: SearchResult[] = []
    scores.forEach((score, docId) => {
      const doc = documents.find(d => d.id === docId)
      if (doc) {
        const context = this.extractContext(doc, queryTerms)
        const highlights = this.extractHighlights(doc, queryTerms)

        results.push({
          id: `result_${docId}_${Date.now()}`,
          documentId: doc.id,
          documentName: doc.name,
          documentType: doc.type,
          relevanceScore: score,
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

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Normalize text for indexing
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Tokenize text into terms
   */
  private static tokenize(text: string): string[] {
    return text
      .split(' ')
      .filter(term => term.length > 2) // Remove short terms
      .filter(term => !this.isStopWord(term))
  }

  /**
   * Check if term is a stop word
   */
  private static isStopWord(term: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'under', 'between', 'among'
    ])
    return stopWords.has(term)
  }

  /**
   * Extract context around search terms
   */
  private static extractContext(doc: any, queryTerms: string[]): string {
    const text = `${doc.name} ${doc.content} ${doc.extractedText || ''}`
    const normalizedText = this.normalizeText(text)
    
    for (const term of queryTerms) {
      const index = normalizedText.indexOf(term)
      if (index !== -1) {
        const start = Math.max(0, index - 50)
        const end = Math.min(normalizedText.length, index + term.length + 50)
        return normalizedText.substring(start, end)
      }
    }
    
    return text.substring(0, 100)
  }

  /**
   * Extract highlighted terms
   */
  private static extractHighlights(doc: any, queryTerms: string[]): string[] {
    const text = this.normalizeText(`${doc.name} ${doc.content} ${doc.extractedText || ''}`)
    return queryTerms.filter(term => text.includes(term))
  }
}

// Search suggestion utilities
export class SearchSuggestionEngine {
  private static recentQueries: string[] = []
  private static popularQueries: Map<string, number> = new Map()

  /**
   * Add query to history
   */
  static addQuery(query: string): void {
    // Add to recent queries
    this.recentQueries = [query, ...this.recentQueries.filter(q => q !== query)].slice(0, 10)
    
    // Update popularity
    this.popularQueries.set(query, (this.popularQueries.get(query) || 0) + 1)
  }

  /**
   * Generate search suggestions
   */
  static generateSuggestions(partialQuery: string, documents: any[]): string[] {
    const suggestions = new Set<string>()
    const query = partialQuery.toLowerCase()

    // Recent queries
    this.recentQueries
      .filter(q => q.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach(q => suggestions.add(q))

    // Popular queries
    Array.from(this.popularQueries.keys())
      .filter(q => q.toLowerCase().includes(query))
      .sort((a, b) => this.popularQueries.get(b)! - this.popularQueries.get(a)!)
      .slice(0, 3)
      .forEach(q => suggestions.add(q))

    // Document-based suggestions
    documents
      .flatMap(doc => doc.aiAnalysis?.keywords || [])
      .filter(keyword => keyword.toLowerCase().includes(query))
      .slice(0, 5)
      .forEach(keyword => suggestions.add(keyword))

    return Array.from(suggestions).slice(0, 8)
  }
}

// Search Input Component
interface SearchInputProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onSuggestionSelect?: (suggestion: string) => void
  showSuggestions?: boolean
}

const SearchInput = React.memo<SearchInputProps>(({
  placeholder = 'Search documents...',
  onSearch,
  onSuggestionSelect,
  showSuggestions = true
}) => {
  usePerformanceMonitor('SearchInput')
  
  const dispatch = useAppDispatch()
  const currentQuery = useAppSelector(selectCurrentQuery)
  const suggestions = useAppSelector(selectSearchSuggestions)
  const recentQueries = useAppSelector(selectRecentQueries)
  
  const [inputValue, setInputValue] = useState(currentQuery)
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false)
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  // Debounced search to improve performance
  const debouncedQuery = useDebounce(inputValue, 300)
  
  // Generate suggestions when input changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      dispatch(generateSuggestions(debouncedQuery))
    }
  }, [debouncedQuery, dispatch])
  
  // Handle search execution
  useEffect(() => {
    if (debouncedQuery !== currentQuery) {
      dispatch(setQuery(debouncedQuery))
      if (debouncedQuery.length >= 2) {
        dispatch(performSearch({ query: debouncedQuery }))
        SearchSuggestionEngine.addQuery(debouncedQuery)
        onSearch?.(debouncedQuery)
      }
    }
  }, [debouncedQuery, currentQuery, dispatch, onSearch])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setShowSuggestionsDropdown(e.target.value.length >= 2)
    setFocusedSuggestionIndex(-1)
  }, [])

  const handleInputFocus = useCallback(() => {
    if (inputValue.length >= 2) {
      setShowSuggestionsDropdown(true)
    }
  }, [inputValue.length])

  const handleInputBlur = useCallback(() => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestionsDropdown(false), 200)
  }, [])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion)
    setShowSuggestionsDropdown(false)
    dispatch(setQuery(suggestion))
    dispatch(performSearch({ query: suggestion }))
    SearchSuggestionEngine.addQuery(suggestion)
    onSuggestionSelect?.(suggestion)
    inputRef.current?.blur()
  }, [dispatch, onSuggestionSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestionsDropdown) return

    const suggestionsList = [...suggestions, ...recentQueries.slice(0, 3)]
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedSuggestionIndex(prev => 
          prev < suggestionsList.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (focusedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestionsList[focusedSuggestionIndex])
        } else {
          setShowSuggestionsDropdown(false)
        }
        break
      case 'Escape':
        setShowSuggestionsDropdown(false)
        inputRef.current?.blur()
        break
    }
  }, [showSuggestionsDropdown, suggestions, recentQueries, focusedSuggestionIndex, handleSuggestionClick])

  const clearSearch = useCallback(() => {
    setInputValue('')
    dispatch(setQuery(''))
    setShowSuggestionsDropdown(false)
    inputRef.current?.focus()
  }, [dispatch])

  const suggestionsList = useMemo(() => {
    const allSuggestions = []
    
    // Add search suggestions
    suggestions.forEach(suggestion => {
      allSuggestions.push({ text: suggestion, type: 'suggestion' as const })
    })
    
    // Add recent queries
    recentQueries.slice(0, 3).forEach(query => {
      if (!suggestions.includes(query)) {
        allSuggestions.push({ text: query, type: 'recent' as const })
      }
    })
    
    return allSuggestions
  }, [suggestions, recentQueries])

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {inputValue && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && showSuggestionsDropdown && suggestionsList.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestionsList.map((item, index) => (
            <button
              key={`${item.type}-${item.text}`}
              onClick={() => handleSuggestionClick(item.text)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors ${
                index === focusedSuggestionIndex 
                  ? 'bg-gray-50 dark:bg-gray-700' 
                  : ''
              }`}
            >
              <div className="mr-3 text-gray-400">
                {item.type === 'recent' ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
              </div>
              <span className="text-gray-900 dark:text-gray-100">{item.text}</span>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                {item.type === 'recent' ? 'Recent' : 'Suggested'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

SearchInput.displayName = 'SearchInput'

// Search Results Component
interface SearchResultsProps {
  onResultClick?: (result: SearchResult) => void
  maxResults?: number
}

const SearchResults = React.memo<SearchResultsProps>(({
  onResultClick,
  maxResults = 20
}) => {
  usePerformanceMonitor('SearchResults')
  
  const results = useAppSelector(selectSearchResults)
  const loading = useAppSelector(selectSearchLoading)
  const error = useAppSelector(selectSearchError)
  const query = useAppSelector(selectCurrentQuery)

  const displayResults = useMemo(() => {
    return results.slice(0, maxResults)
  }, [results, maxResults])

  const handleResultClick = useStableCallback((result: SearchResult) => {
    onResultClick?.(result)
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} loading />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card error={error} className="text-center">
        <p>Failed to search documents. Please try again.</p>
      </Card>
    )
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Search your documents
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Enter a search term to find relevant documents and content
        </p>
      </div>
    )
  }

  if (displayResults.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No results found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          No documents match your search for "{query}"
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </div>
      
      {displayResults.map(result => (
        <Card
          key={result.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleResultClick(result)}
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {result.documentName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {result.context}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{result.documentType}</span>
                <span>Relevance: {Math.round(result.relevanceScore * 100)}%</span>
              </div>
              
              {result.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.highlights.slice(0, 3).map((highlight, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
      
      {results.length > maxResults && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {maxResults} of {results.length} results
          </p>
        </div>
      )}
    </div>
  )
})

SearchResults.displayName = 'SearchResults'

// Main Optimized Search Interface
interface OptimizedSearchInterfaceProps {
  onResultSelect?: (result: SearchResult) => void
  className?: string
}

export const OptimizedSearchInterface = React.memo<OptimizedSearchInterfaceProps>(({
  onResultSelect,
  className = ''
}) => {
  usePerformanceMonitor('OptimizedSearchInterface')
  
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = useStableCallback((query: string) => {
    console.log('Search performed:', query)
  })

  const handleSuggestionSelect = useStableCallback((suggestion: string) => {
    console.log('Suggestion selected:', suggestion)
  })

  const handleResultClick = useStableCallback((result: SearchResult) => {
    onResultSelect?.(result)
  })

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Search Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <SearchInput
            onSearch={handleSearch}
            onSuggestionSelect={handleSuggestionSelect}
          />
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="h-4 w-4" />}
            >
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-auto p-6">
        <SearchResults onResultClick={handleResultClick} />
      </div>
    </div>
  )
})

OptimizedSearchInterface.displayName = 'OptimizedSearchInterface'

export default OptimizedSearchInterface
