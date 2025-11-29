"use client"

import { useState, useRef, useEffect } from 'react'
import { useRAG } from '../contexts/RAGContext'
import { SearchResult } from '../types'
import { Search, Filter, Download, ExternalLink, Clock, FileText, Zap } from 'lucide-react'
import { CitationButton } from '@/components/citations'
import { createSemanticCacheWrapper } from '../utils/semantic-cache-wrapper'
import { generateEmbedding } from '../utils/document-processing'
import type { CacheResult } from '../utils/semantic-cache'

export function SearchInterface() {
  const { searchDocuments, documents } = useRAG()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [semanticCache, setSemanticCache] = useState<Awaited<ReturnType<typeof createSemanticCacheWrapper>> | null>(null)
  const [cacheHit, setCacheHit] = useState(false)
  const [filters, setFilters] = useState({
    documentTypes: [] as string[],
    similarity: 0.7,
    maxResults: 10
  })
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Initialize semantic cache
  useEffect(() => {
    createSemanticCacheWrapper({
      enableSemanticCache: true,
      useLegacyCache: true,
      preferSemanticCache: true
    }).then(cache => {
      setSemanticCache(cache)
      console.log('✅ Semantic cache initialized for search interface')
    }).catch(error => {
      console.error('Failed to initialize semantic cache:', error)
    })
  }, [])

  const handleSearch = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query
    if (!queryToSearch.trim()) return

    setIsSearching(true)
    setCacheHit(false)
    
    try {
      // Check semantic cache first
      if (semanticCache) {
        const queryEmbedding = await generateEmbedding(queryToSearch)
        const cachedResults = await semanticCache.get(queryToSearch, queryEmbedding)
        
        if (cachedResults && cachedResults.length > 0) {
          console.log(`✨ Search Interface Cache HIT: Found ${cachedResults.length} cached results`)
          setCacheHit(true)
          
          // Convert cached results to SearchResult format
          const convertedResults: SearchResult[] = []
          for (const cached of cachedResults) {
            // Find the actual document and chunk from documents
            const doc = documents.find(d => d.id === (cached.metadata?.['documentId'] as string))
            const chunk = doc?.chunks?.find(c => c.id === cached.id)
            
            if (doc && chunk) {
              convertedResults.push({
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
          
          setSearchResults(convertedResults)
          
          // Add to search history
          if (!searchHistory.includes(queryToSearch)) {
            setSearchHistory(prev => [queryToSearch, ...prev.slice(0, 9)])
          }
          
          return
        }
        
        console.log(`💨 Cache MISS: Performing full search`)
      }
      
      // Cache miss or no cache - perform full search
      const results = await searchDocuments(queryToSearch)
      setSearchResults(results)
      
      // Store results in cache for future queries
      if (semanticCache && results.length > 0) {
        const queryEmbedding = await generateEmbedding(queryToSearch)
        const cacheResults: CacheResult[] = results.map(result => ({
          id: result.chunk?.id || result.id,
          score: result.similarity || result.score,
          content: result.chunk?.content || result.content,
          metadata: {
            documentId: result.document?.id,
            title: result.document?.name,
            type: result.document?.type || 'document'
          }
        }))
        
        const documentIds = [...new Set(results.map(r => r.document?.id).filter(Boolean) as string[])]
        await semanticCache.set(queryToSearch, queryEmbedding, cacheResults, documentIds)
        console.log('💾 Cached search results for future queries')
      }
      
      // Add to search history
      if (!searchHistory.includes(queryToSearch)) {
        setSearchHistory(prev => [queryToSearch, ...prev.slice(0, 9)]) // Keep last 10 searches
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setQuery('')
    setSearchResults([])
    searchInputRef.current?.focus()
  }

  const formatSearchTime = (time: number) => {
    return `${time.toFixed(2)}s`
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-gray-100">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Search Documents
          </h2>
          
          {/* Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search across all your documents..."
                className="w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSearching}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {query && (
                  <button
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1 rounded ${showFilters ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600`}
                >
                  <Filter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSearch()}
                  disabled={isSearching || !query.trim()}
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Types
                  </label>
                  <div className="space-y-2">
                    {['pdf', 'txt', 'docx', 'markdown'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.documentTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                documentTypes: [...prev.documentTypes, type]
                              }))
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                documentTypes: prev.documentTypes.filter(t => t !== type)
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{type.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Similarity Threshold
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={filters.similarity}
                    onChange={(e) => setFilters(prev => ({ ...prev, similarity: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {(filters.similarity * 100).toFixed(0)}% similarity
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Results
                  </label>
                  <select
                    value={filters.maxResults}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value={5}>5 results</option>
                    <option value={10}>10 results</option>
                    <option value={20}>20 results</option>
                    <option value={50}>50 results</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(historyQuery)
                      handleSearch(historyQuery)
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Clock className="w-3 h-3 inline mr-1" />
                    {historyQuery}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Searching documents...</p>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Search Results ({searchResults.length})
                </h3>
                {cacheHit && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Zap className="w-3 h-3 mr-1" />
                    Cached ⚡
                  </span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Zap className="w-4 h-4 mr-1" />
                {cacheHit ? '~50ms (cached)' : formatSearchTime(0.45)}
              </div>
            </div>
            
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {result.document?.name || 'Unknown Document'}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>Score: {((result.similarity || result.score) * 100).toFixed(1)}%</span>
                          {result.chunk?.metadata?.page && (
                            <span>• Page {result.chunk.metadata.page}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {result.document && (
                        <CitationButton 
                          document={result.document} 
                          variant="dropdown"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        />
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                    <p>{highlightText(result.chunk?.content || result.content, query)}</p>
                  </div>
                  
                  {result.relevantText && (
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <strong>Context:</strong> {highlightText(result.relevantText, query)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : query && !isSearching ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <Search className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-sm text-center">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <Search className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Search your documents</h3>
            <p className="text-sm text-center">
              Enter a search query to find relevant content across all your documents
            </p>
            {documents.length === 0 && (
              <p className="text-xs text-center mt-2">
                Upload some documents first to enable search functionality
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
