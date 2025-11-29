"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRAG } from '../contexts/RAGContext'
import { SearchResult } from '../types'
import { searchSuggestionsEngine, SearchSuggestion } from '../utils/search-suggestions'
import { Search, Filter, Download, ExternalLink, Clock, FileText, Zap, X, Lightbulb, History, Hash, BookOpen } from 'lucide-react'

interface SearchSuggestionItem {
  suggestion: SearchSuggestion
  isSelected: boolean
  onClick: () => void
}

function SearchSuggestionComponent({ suggestion, isSelected, onClick }: SearchSuggestionItem) {
  const getIcon = () => {
    switch (suggestion.type) {
      case 'historical': return <History className="h-4 w-4 text-gray-400" />
      case 'document': return <FileText className="h-4 w-4 text-blue-500" />
      case 'keyword': return <Hash className="h-4 w-4 text-green-500" />
      default: return <Lightbulb className="h-4 w-4 text-amber-500" />
    }
  }

  return (
    <div
      className={`px-4 py-3 cursor-pointer border-l-2 transition-all ${
        isSelected 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' 
          : 'bg-white dark:bg-gray-800 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {suggestion.text}
          </p>
          {suggestion.metadata && (
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
              {suggestion.metadata.frequency && (
                <span>Used {suggestion.metadata.frequency} times</span>
              )}
              {suggestion.metadata.resultCount !== undefined && (
                <span>• {suggestion.metadata.resultCount} results</span>
              )}
              {suggestion.metadata.lastUsed && (
                <span>• {new Date(suggestion.metadata.lastUsed).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
          {Math.round(suggestion.score * 100)}%
        </div>
      </div>
    </div>
  )
}

export function SearchInterface() {
  const { searchDocuments, documents } = useRAG()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [filters, setFilters] = useState({
    documentTypes: [] as string[],
    similarity: 0.7,
    maxResults: 10
  })
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Initialize suggestions engine with documents
  useEffect(() => {
    searchSuggestionsEngine.updateDocuments(documents)
  }, [documents])

  // Debounced suggestions fetching
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const newSuggestions = await searchSuggestionsEngine.getSuggestions(searchQuery)
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
      setSelectedSuggestionIndex(-1)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  // Handle query changes with debouncing
  const handleQueryChange = (value: string) => {
    setQuery(value)
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce suggestions
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 200)
  }

  const handleSearch = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query
    if (!queryToSearch.trim()) return

    // Hide suggestions
    setShowSuggestions(false)
    setIsSearching(true)

    try {
      const results = await searchDocuments(queryToSearch)
      setSearchResults(results)
      
      // Record the query for future suggestions
      searchSuggestionsEngine.recordQuery(queryToSearch, results.length)
      
      // Add to search history
      if (!searchHistory.includes(queryToSearch)) {
        setSearchHistory(prev => [queryToSearch, ...prev.slice(0, 9)])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    const newQuery = suggestion.text.replace(/^"(.*)"$/, '$1') // Remove quotes if present
    setQuery(newQuery)
    setShowSuggestions(false)
    handleSearch(newQuery)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  const handleInputFocus = () => {
    if (query.trim() && suggestions.length > 0) {
      setShowSuggestions(true)
    } else if (!query.trim()) {
      // Show popular queries when focusing empty input
      fetchSuggestions('')
    }
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false)
      }
    }, 150)
  }

  const clearSearch = () => {
    setQuery('')
    setSearchResults([])
    setSuggestions([])
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  const handleHistoryClick = (historicalQuery: string) => {
    setQuery(historicalQuery)
    handleSearch(historicalQuery)
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Intelligent Search
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                showFilters
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Filter className="h-4 w-4 mr-1 inline" />
              Filters
            </button>
          </div>
        </div>

        {/* Search Input with Suggestions */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Search your documents... (try typing to see suggestions)"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
            >
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <SearchSuggestionComponent
                    key={suggestion.id}
                    suggestion={suggestion}
                    isSelected={index === selectedSuggestionIndex}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Types
                </label>
                <select 
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.documentTypes}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    documentTypes: Array.from(e.target.selectedOptions, option => option.value)
                  }))}
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">Word Documents</option>
                  <option value="txt">Text Files</option>
                  <option value="html">HTML</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Similarity Threshold: {filters.similarity}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={filters.similarity}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    similarity: parseFloat(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Results
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={filters.maxResults}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    maxResults: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <Clock className="h-4 w-4 mr-1" />
              Recent Searches
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.slice(0, 5).map((historyQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(historyQuery)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {historyQuery}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-6">
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Searching with AI enhancement...</span>
            </div>
          </div>
        )}

        {!isSearching && searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Found {searchResults.length} results
              </h3>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                  <Download className="h-4 w-4 mr-1 inline" />
                  Export
                </button>
              </div>
            </div>

            {searchResults.map((result, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {result.document?.name || 'Unknown Document'}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{result.document?.type?.toUpperCase() || 'DOCUMENT'}</span>
                        <span>•</span>
                        <span>Score: {Math.round((result.similarity || result.score) * 100)}%</span>
                        <span>•</span>
                        <span>{result.document?.uploadedAt ? new Date(result.document.uploadedAt).toLocaleDateString() : 'Unknown Date'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                      <Zap className="h-3 w-3 mr-1 inline" />
                      AI Enhanced
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {result.relevantText ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-400">
                      <p dangerouslySetInnerHTML={{ 
                        __html: result.relevantText.replace(
                          new RegExp(`(${query})`, 'gi'),
                          '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
                        )
                      }} />
                    </div>
                  ) : (
                    <p className="line-clamp-3">{result.chunk?.content || result.content}</p>
                  )}
                </div>

                {result.document?.aiAnalysis && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-4 text-sm">
                      {result.document.aiAnalysis.keywords.slice(0, 3).map((keyword, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                          {keyword}
                        </span>
                      ))}
                      <span className="text-gray-500 dark:text-gray-400">
                        Sentiment: {result.document.aiAnalysis.sentiment}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isSearching && query && searchResults.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}

        {!query && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Intelligent Document Search
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Search across all your documents with AI-powered suggestions and semantic understanding
            </p>
            <div className="max-w-md mx-auto space-y-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Features:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Real-time search suggestions</li>
                  <li>Semantic similarity matching</li>
                  <li>Query history and auto-completion</li>
                  <li>Advanced filtering options</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
