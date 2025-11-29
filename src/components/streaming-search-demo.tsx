"use client"

import React, { useState, useCallback } from 'react'
import { useSearch } from '../rag/contexts/UnifiedSearchContext'
import { SearchResult } from '../rag/types'

interface StreamingSearchDemoProps {
  className?: string
}

export function StreamingSearchDemo({ className = '' }: StreamingSearchDemoProps) {
  const { searchDocuments, isSearching, searchResults: contextResults } = useSearch()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [progressiveResults, setProgressiveResults] = useState<SearchResult[]>([])

  const handleStreamingSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return

    // Clear previous results
    setResults([])
    setProgressiveResults([])

    // Use the searchDocuments method from UnifiedSearchContext
    if (searchDocuments) {
      await searchDocuments(query)
    }
    
    // Simulate streaming by gradually adding results
    const mockStreamingResults: SearchResult[] = [
      {
        id: 'stream-1',
        content: `Streaming result 1 for "${query}": This demonstrates the streaming search functionality with progressive result loading.`,
        score: 0.95,
        metadata: { source: 'streaming', query },
        relevantText: `Streaming content for "${query}"`
      },
      {
        id: 'stream-2',
        content: `Streaming result 2 for "${query}": Additional context and information found through the enhanced search process.`,
        score: 0.88,
        metadata: { source: 'streaming', query },
        relevantText: `More streaming content for "${query}"`
      },
      {
        id: 'stream-3',
        content: `Streaming result 3 for "${query}": Final streaming result with comprehensive information and detailed insights.`,
        score: 0.82,
        metadata: { source: 'streaming', query },
        relevantText: `Final streaming content for "${query}"`
      }
    ]

    // Simulate progressive loading
    for (let i = 0; i < mockStreamingResults.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newResult = mockStreamingResults[i]
      setProgressiveResults(prev => [...prev, newResult])
      setResults(prev => [...prev, newResult])
    }
  }, [query, isSearching, searchDocuments])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleStreamingSearch()
    }
  }

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1)
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.7) return 'text-yellow-600' 
    return 'text-red-600'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Streaming Search Demo</h3>
            <p className="text-sm text-gray-600">Experience real-time progressive search results</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your search query..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={isSearching}
            />
            <button
              onClick={handleStreamingSearch}
              disabled={isSearching || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </>
              )}
            </button>
          </div>

          {(progressiveResults.length > 0 || results.length > 0) && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {isSearching ? 'Streaming Results...' : 'Search Results'}
                </h4>
                <span className="text-sm text-gray-500">
                  {progressiveResults.length} / {results.length} results
                </span>
              </div>

              <div className="space-y-3">
                {progressiveResults.map((result, index) => (
                  <div 
                    key={result.id}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50 animate-fade-in"
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          Result #{index + 1}
                        </span>
                        <span className={`text-sm font-medium ${getScoreColor(result.score)}`}>
                          {formatScore(result.score)}% match
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      {result.content}
                    </p>
                    
                    {result.relevantText && (
                      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                        <span className="font-medium">Relevant excerpt:</span> {result.relevantText}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isSearching && progressiveResults.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-gray-500">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    <span>Searching for results...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {contextResults && contextResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-3">Context Results</h4>
          <div className="space-y-2">
            {contextResults.map((result, index) => (
              <div key={result.id} className="p-3 bg-gray-50 rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Context Result #{index + 1}</span>
                  <span className={`text-sm ${getScoreColor(result.score)}`}>
                    {formatScore(result.score)}%
                  </span>
                </div>
                <p className="text-sm text-gray-700">{result.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StreamingSearchDemo
